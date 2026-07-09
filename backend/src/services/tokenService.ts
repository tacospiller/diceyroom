import { createHash, randomBytes } from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { SessionStore } from "../stores/sessionStore";

export interface AccessTokenPayload {
  sub: string; // user id
}

const REFRESH_TTL_SECONDS = env.REFRESH_TTL_DAYS * 24 * 60 * 60;
export const REFRESH_TTL_MS = REFRESH_TTL_SECONDS * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues stateless JWT access tokens and manages opaque refresh tokens.
 * Refresh-token persistence is delegated to an injected SessionStore, so the
 * same logic works over Redis (prod) or an in-memory store (dev/tests).
 */
export class TokenService {
  constructor(private readonly sessions: SessionStore) {}

  // ---- Access token (stateless JWT) ----------------------------------------

  signAccessToken(userId: string): string {
    const payload: AccessTokenPayload = { sub: userId };
    const options: SignOptions = {
      expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  // ---- Refresh token (opaque, persisted via SessionStore) ------------------

  /**
   * Issue an opaque refresh token and persist its hash. The raw token is
   * returned to the caller (set as an httpOnly cookie) and is never stored
   * server-side; only its SHA-256 hash is.
   */
  async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(48).toString("hex");
    await this.sessions.saveRefreshToken(
      hashToken(rawToken),
      userId,
      REFRESH_TTL_SECONDS
    );
    return rawToken;
  }

  async getUserIdForRefreshToken(rawToken: string): Promise<string | null> {
    return this.sessions.getUserIdByRefreshToken(hashToken(rawToken));
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await this.sessions.deleteRefreshToken(hashToken(rawToken));
  }

  /**
   * Rotate a refresh token: validate the old one, revoke it, and issue a new
   * one. Returns the new raw token, or null if the old token was invalid.
   */
  async rotateRefreshToken(
    rawToken: string
  ): Promise<{ userId: string; token: string } | null> {
    const userId = await this.getUserIdForRefreshToken(rawToken);
    if (!userId) return null;
    await this.revokeRefreshToken(rawToken);
    const token = await this.issueRefreshToken(userId);
    return { userId, token };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessions.deleteAllRefreshTokensForUser(userId);
  }
}
