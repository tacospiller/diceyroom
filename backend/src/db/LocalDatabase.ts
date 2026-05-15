import fs from 'fs/promises';
import path from 'path';
import { Database, DBDocument } from './Database';
import { DuplicateException } from './errors';

export class LocalDatabase implements Database {
  constructor(private readonly dataDir: string) {}

  private itemPath(table: string, key: string): string {
    return path.join(this.dataDir, table, `${key}.json`);
  }

  async query<T extends DBDocument>(table: string, filter: Partial<T>, projection?: (keyof T)[]): Promise<Partial<T>[]> {
    const dir = path.join(this.dataDir, table);
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const entries = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(f => fs.readFile(path.join(dir, f), 'utf-8').then(raw => JSON.parse(raw) as T)),
    );
    const filterEntries = Object.entries(filter) as [string, unknown][];
    const filtered = entries.filter(item =>
      filterEntries.every(([k, v]) => (item as Record<string, unknown>)[k] === v),
    );
    if (!projection || projection.length === 0) return filtered;
    return filtered.map(item => {
      const projected = {} as Record<string, unknown>;
      for (const k of projection) projected[k as string] = (item as Record<string, unknown>)[k as string];
      return projected as Partial<T>;
    });
  }

  async get<T extends DBDocument>(table: string, key: string): Promise<T | null> {
    try {
      const raw = await fs.readFile(this.itemPath(table, key), 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async create<T extends DBDocument>(table: string, item: T): Promise<void> {
    const filePath = this.itemPath(table, item.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.writeFile(filePath, JSON.stringify(item, null, 2), { flag: 'wx' });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') throw new DuplicateException(table, item.key);
      throw err;
    }
  }

  async save<T extends DBDocument>(table: string, item: T): Promise<void> {
    const filePath = this.itemPath(table, item.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(item, null, 2));
  }
}
