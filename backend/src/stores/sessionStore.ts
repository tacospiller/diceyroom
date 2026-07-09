/**
 * Persistence boundary for refresh-token sessions.
 *
 * Stores the mapping (refresh-token hash -> user id) with a TTL, and tracks
 * which tokens belong to a user so a user's sessions can be revoked at once.
 * Implemented by RedisSessionStore (production, persistent across restarts)
 * and InMemorySessionStore (local dev / tests).
 */
export interface SessionStore {
  /** Persist a refresh-token hash for a user, expiring after ttlSeconds. */
  saveRefreshToken(
    tokenHash: string,
    userId: string,
    ttlSeconds: number
  ): Promise<void>;

  /** Resolve the user id for a token hash, or null if unknown/expired. */
  getUserIdByRefreshToken(tokenHash: string): Promise<string | null>;

  /** Invalidate a single refresh token (logout on one device). */
  deleteRefreshToken(tokenHash: string): Promise<void>;

  /** Invalidate every refresh token for a user (logout everywhere). */
  deleteAllRefreshTokensForUser(userId: string): Promise<void>;

  /** Release any underlying resources (connections, timers). */
  disconnect(): Promise<void>;
}
