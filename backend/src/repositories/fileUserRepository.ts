import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { User } from "../models/user";
import {
  CreateUserInput,
  UpdateProfileInput,
  UserRepository,
} from "./userRepository";
import { readJsonFile, writeJsonFile } from "../utils/fileJson";

/**
 * Local file-backed user store for development. Users are cached in memory and
 * persisted to `<dataDir>/users.json` after each write, so data survives
 * restarts. Not intended for production or multi-process use.
 */
export class FileUserRepository implements UserRepository {
  private readonly file: string;
  private byId = new Map<string, User>();
  private loaded?: Promise<void>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dataDir: string) {
    this.file = join(dataDir, "users.json");
  }

  private ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const users = await readJsonFile<User[]>(this.file, []);
        this.byId = new Map(users.map((u) => [u.id, u]));
      })();
    }
    return this.loaded;
  }

  /** Serialize writes and always persist the latest map snapshot. */
  private persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() =>
      writeJsonFile(this.file, [...this.byId.values()])
    );
    return this.writeQueue;
  }

  async findById(id: string): Promise<User | null> {
    await this.ensureLoaded();
    return this.byId.get(id) ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    await this.ensureLoaded();
    for (const user of this.byId.values()) {
      if (user.googleId === googleId) return user;
    }
    return null;
  }

  async create(input: CreateUserInput): Promise<User> {
    await this.ensureLoaded();
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      googleId: input.googleId,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(user.id, user);
    await this.persist();
    return user;
  }

  async updateProfile(id: string, fields: UpdateProfileInput): Promise<User> {
    await this.ensureLoaded();
    const existing = this.byId.get(id);
    if (!existing) {
      throw new Error(`User not found: ${id}`);
    }
    const updated: User = {
      ...existing,
      email: fields.email,
      name: fields.name,
      avatarUrl: fields.avatarUrl,
      updatedAt: new Date().toISOString(),
    };
    this.byId.set(id, updated);
    await this.persist();
    return updated;
  }
}
