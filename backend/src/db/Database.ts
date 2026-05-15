export interface DBDocument {
  key: string;
}

export interface Database {
  get<T extends DBDocument>(table: string, key: string): Promise<T | null>;
  query<T extends DBDocument>(table: string, filter: Partial<T>, projection?: (keyof T)[]): Promise<Partial<T>[]>;
  create<T extends DBDocument>(table: string, item: T): Promise<void>;
  save<T extends DBDocument>(table: string, item: T): Promise<void>;
}
