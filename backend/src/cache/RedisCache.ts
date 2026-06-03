import Redis from 'ioredis';
import { Cache } from './Cache';

export class RedisCache implements Cache {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url);
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds != null) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const raws = await this.client.mget(...keys);
    return raws.map((r) => (r === null ? null : (JSON.parse(r) as T)));
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }

  async zadd(setKey: string, items: { member: string; score: number }[]): Promise<void> {
    if (items.length === 0) return;
    const args: (string | number)[] = [];
    for (const { member, score } of items) {
      args.push(score, member);
    }
    await (this.client.zadd as any)(setKey, ...args);
  }

  async zset(setKey: string, items: { member: string; score: number }[]): Promise<void> {
    const pipeline = this.client.multi();
    pipeline.del(setKey);
    if (items.length > 0) {
      const args: (string | number)[] = [];
      for (const { member, score } of items) {
        args.push(score, member);
      }
      (pipeline.zadd as any)(setKey, ...args);
    }
    await pipeline.exec();
  }

  async zrem(setKey: string, members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.client.zrem(setKey, ...members);
  }

  async zget(setKey: string): Promise<{ member: string; score: number }[]> {
    const raw = await this.client.zrevrange(setKey, 0, -1, 'WITHSCORES');
    const result: { member: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      result.push({ member: raw[i], score: Number(raw[i + 1]) });
    }
    return result;
  }

  async sadd(setKey: string, members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.client.sadd(setKey, ...members);
  }

  async srem(setKey: string, members: string[]): Promise<void> {
    if (members.length === 0) return;
    await this.client.srem(setKey, ...members);
  }

  async sset(setKey: string, members: string[]): Promise<void> {
    const pipeline = this.client.multi();
    pipeline.del(setKey);
    if (members.length > 0) {
      pipeline.sadd(setKey, ...members);
    }
    await pipeline.exec();
  }

  async sget(setKey: string): Promise<string[]> {
    return await this.client.smembers(setKey);
  }
}
