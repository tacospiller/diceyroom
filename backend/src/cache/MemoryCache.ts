import { Cache } from './Cache';

interface Entry<T> {
  value: T;
  expiresAt: number | null;
}

export class MemoryCache implements Cache {
  private store = new Map<string, Entry<unknown>>();
  private zStore = new Map<string, Map<string, number>>();
  private sStore = new Map<string, Set<string>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as Entry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds != null ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((k) => this.get<T>(k)));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.zStore.delete(key);
    this.sStore.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.zStore.clear();
    this.sStore.clear();
  }

  async zadd(setKey: string, items: { member: string; score: number }[]): Promise<void> {
    let set = this.zStore.get(setKey);
    if (!set) {
      set = new Map();
      this.zStore.set(setKey, set);
    }
    for (const { member, score } of items) {
      set.set(member, score);
    }
  }

  async zset(setKey: string, items: { member: string; score: number }[]): Promise<void> {
    const set = new Map<string, number>();
    for (const { member, score } of items) {
      set.set(member, score);
    }
    this.zStore.set(setKey, set);
  }

  async zrem(setKey: string, members: string[]): Promise<void> {
    const set = this.zStore.get(setKey);
    if (!set) return;
    for (const m of members) set.delete(m);
    if (set.size === 0) this.zStore.delete(setKey);
  }

  async zget(setKey: string): Promise<{ member: string; score: number }[]> {
    const set = this.zStore.get(setKey);
    if (!set) return [];
    return Array.from(set.entries())
      .map(([member, score]) => ({ member, score }))
      .sort((a, b) => b.score - a.score);
  }

  async sadd(setKey: string, members: string[]): Promise<void> {
    let set = this.sStore.get(setKey);
    if (!set) {
      set = new Set();
      this.sStore.set(setKey, set);
    }
    for (const m of members) set.add(m);
  }

  async srem(setKey: string, members: string[]): Promise<void> {
    const set = this.sStore.get(setKey);
    if (!set) return;
    for (const m of members) set.delete(m);
    if (set.size === 0) this.sStore.delete(setKey);
  }

  async sset(setKey: string, members: string[]): Promise<void> {
    this.sStore.set(setKey, new Set(members));
  }

  async sget(setKey: string): Promise<string[]> {
    const set = this.sStore.get(setKey);
    if (!set) return [];
    return Array.from(set);
  }
}
