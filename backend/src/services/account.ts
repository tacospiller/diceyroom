import { customAlphabet } from 'nanoid';
import { alphanumeric } from 'nanoid-dictionary';
import config from '../config';
import DB from '../db';
import { DBDocument } from '../db/Database';
import { DuplicateException } from '../db/errors';
import { subtle } from 'crypto';

const TABLE = config.tables.users;
const genUid = customAlphabet(alphanumeric);
const salt = config.crypto.salt;

async function hash(password: string) {
  var passWithSalt = new TextEncoder().encode(password + salt);
  var passHashedAgain = await subtle.digest("SHA-256", passWithSalt);
  return Array.from(new Uint8Array(passHashedAgain))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export interface UserDocument extends DBDocument {

}

export interface UserNicknameDocument extends DBDocument {
  userId: string;
  passHash: string;
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
  var key = genUid();

  var nicknameDoc: UserNicknameDocument = {
    key: username,
    userId: key,
    passHash: await hash(passhash) 
  };

  try {
    await DB.create(TABLE, nicknameDoc);
  } catch (err) {
    if (err instanceof DuplicateException) throw new UsernameTakenError(username);
    throw err;
  }

  const doc: UserDocument = { 
    key: key, 
  };

  // TODO: duplicate key check
  await DB.create(TABLE, doc);
}

export async function login(username: string, passhash: string): Promise<UserNicknameDocument | null> {
  const doc = await DB.get<UserNicknameDocument>(TABLE, username);
  if (doc?.passHash !== await hash(passhash)) return null;
  return doc;
}
