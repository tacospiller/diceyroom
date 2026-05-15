import { nanoid } from 'nanoid';
import config from '../config';
import DB from '../db';
import { DBDocument } from '../db/Database';
import { DuplicateException } from '../db/errors';

const TABLE = config.tables.users;

export interface UserDocument extends DBDocument {
  userid: string;
  username: string;
  passhash: string;
}

export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`Username already taken: ${username}`);
    this.name = 'UsernameTakenError';
  }
}

export class InvalidUsernameError extends Error {
  constructor(username: string) {
    super(`Invalid username: ${username}`);
    this.name = 'InvalidUsernameError';
  }
}

export async function join(username: string, passhash: string): Promise<void> {
  if ((username?.length ?? 0) <= 3) throw new InvalidUsernameError(username);
  const doc: UserDocument = { key: username, userid: nanoid(), username: username, passhash };
  try {
    await DB.create(TABLE, doc);
  } catch (err) {
    if (err instanceof DuplicateException) throw new UsernameTakenError(username);
    throw err;
  }
}

export async function login(username: string, passhash: string): Promise<UserDocument | null> {
  const doc = await DB.get<UserDocument>(TABLE, username);
  if (doc?.passhash !== passhash) return null;
  return doc;
}
