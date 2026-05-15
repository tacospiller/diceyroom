export class DuplicateException extends Error {
  constructor(table: string, key: string) {
    super(`Item already exists: ${table}/${key}`);
    this.name = 'DuplicateException';
  }
}
