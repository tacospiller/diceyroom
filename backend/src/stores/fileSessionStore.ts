import { join } from "node:path";
import { SessionStore } from "./sessionStore";
import { readJsonFile, writeJsonFile } from "../utils/fileJson";

interface Entry {
  userId: string;
  expiresAt: number; // epoch ms
}

/**
 * Local file-backed session store for development. Refresh-token hashes are
 * cached in memory and persisted to `<dataDir>/sessions.json` so sessions
 * survive restarts. TTLs are enforced lazily on read. Dev use only.
 */
export class FileSessionStore implements SessionStore {
  private readonly file: string;
  private tokens = new Map<string, Entry>();
  private loaded?: Promise<void>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dataDir: string) {
    this.file = join(dataDir, "sessions.json");
  }

  private ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const raw = await readJsonFile<Record<string, Entry>>(this.file, {});
        const now = Date.now();
        this.tokens = new Map(
          Object.entries(raw).filter(([, entry]) => entry.expiresAt > now)
        );
      })();
    }
    return this.loaded;
  }

  /** Serialize writes and always persist the latest map snapshot. */
  private persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() =>
      writeJsonFile(this.file, Object.fromEntries(this.tokens))
    );
    return this.writeQueue;
  }

  async saveRefreshToken(
    tokenHash: string,
    userId: string,
    ttlSeconds: number
  ): Promise<void> {
    await this.ensureLoaded();
    this.tokens.set(tokenHash, {
      userId,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    await this.persist();
  }

  async getUserIdByRefreshToken(tokenHash: string): Promise<string | null> {
    await this.ensureLoaded();
    const entry = this.tokens.get(tokenHash);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.tokens.delete(tokenHash);
      await this.persist();
      return null;
    }
    return entry.userId;
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await this.ensureLoaded();
    if (this.tokens.delete(tokenHash)) {
      await this.persist();
    }
  }

  async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.ensureLoaded();
    let changed = false;
    for (const [hash, entry] of this.tokens) {
      if (entry.userId === userId) {
        this.tokens.delete(hash);
        changed = true;
      }
    }
    if (changed) await this.persist();
  }

  async disconnect(): Promise<void> {
    // Flush any pending writes before shutdown.
    await this.writeQueue;
  }
}
