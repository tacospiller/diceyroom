import { createRedisClient, RedisClient } from "../db/redis";
import { SessionStore } from "./sessionStore";

/**
 * Redis-backed session store. Refresh-token hashes persist across server
 * restarts (that's the "persistent session"), keyed as:
 *   refresh:<tokenHash>       -> userId          (with TTL)
 *   refresh:user:<userId>     -> set of tokenHash (for revoke-all)
 */
export class RedisSessionStore implements SessionStore {
  private readonly redis: RedisClient;

  constructor(client?: RedisClient) {
    this.redis = client ?? createRedisClient();
  }

  private refreshKey(tokenHash: string): string {
    return `refresh:${tokenHash}`;
  }

  private userKey(userId: string): string {
    return `refresh:user:${userId}`;
  }

  async saveRefreshToken(
    tokenHash: string,
    userId: string,
    ttlSeconds: number
  ): Promise<void> {
    const pipeline = this.redis.multi();
    pipeline.set(this.refreshKey(tokenHash), userId, "EX", ttlSeconds);
    pipeline.sadd(this.userKey(userId), tokenHash);
    pipeline.expire(this.userKey(userId), ttlSeconds);
    await pipeline.exec();
  }

  async getUserIdByRefreshToken(tokenHash: string): Promise<string | null> {
    return this.redis.get(this.refreshKey(tokenHash));
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    const userId = await this.redis.get(this.refreshKey(tokenHash));
    const pipeline = this.redis.multi();
    pipeline.del(this.refreshKey(tokenHash));
    if (userId) {
      pipeline.srem(this.userKey(userId), tokenHash);
    }
    await pipeline.exec();
  }

  async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    const hashes = await this.redis.smembers(this.userKey(userId));
    const pipeline = this.redis.multi();
    for (const hash of hashes) {
      pipeline.del(this.refreshKey(hash));
    }
    pipeline.del(this.userKey(userId));
    await pipeline.exec();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
