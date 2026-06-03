export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;

  zadd(setKey: string, items: {member: string, score: number}[]): Promise<void>;
  zset(setKey: string, items: {member: string, score: number}[]): Promise<void>;
  zrem(setKey: string, members: string[]): Promise<void>;
  zget(setKey: string): Promise<{member: string, score: number}[]>;

  sadd(setKey: string, members: string[]): Promise<void>;
  srem(setKey: string, members: string[]): Promise<void>;
  sset(setKey: string, members: string[]): Promise<void>;
  sget(setKey: string): Promise<string[]>;
}

