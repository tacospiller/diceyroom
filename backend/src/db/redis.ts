import Redis from "ioredis";
import { env } from "../config/env";

export type RedisClient = Redis;

/**
 * Create a Redis client. Kept as a factory (rather than a module-level
 * singleton) so that in-memory persistence mode never opens a connection.
 */
export function createRedisClient(): RedisClient {
  const client = new Redis(env.REDIS_URL, {
    // Fail fast instead of buffering commands forever when Redis is down.
    maxRetriesPerRequest: 3,
  });

  client.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[redis] connected");
  });

  return client;
}
