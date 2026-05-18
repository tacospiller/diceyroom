import config from "../config";
import db from "../db";
import { DBDocument } from "../db/Database";
import { nanoid } from "nanoid";

const TABLE = config.tables.posts;

export interface PostDocument extends DBDocument {
    userid: string;
    rule: string;
    description: string;
    sessionDate: Date;
    recruitEndDate: Date;
    creationDate: Date;
}

interface PostListEntry {
    key: string;
    userid: string;
    rule: string;
    sessionDate: Date;
    recruitEndDate: Date;
}

export class PostNotFoundError extends Error {
  constructor(key: string) {
    super(`Post not found: ${key}`);
    this.name = 'PostNotFoundError';
  }
}

export class NotAuthorizedError extends Error {
  constructor(key: string) {
    super(`Post edit not authorized: ${key}`);
    this.name = 'NotAuthorizedError';
  }
}

export async function createPost(doc: PostDocument) {
    doc.key = nanoid(6);
    doc.creationDate = new Date();
    await db.create(TABLE, doc);
}

export async function editPost(doc: PostDocument) {
    var checkDoc = await db.get<PostDocument>(TABLE, doc.key);
    if (checkDoc === null) {
        throw new PostNotFoundError(doc.key);
    }
    if (checkDoc.userid !== doc.userid) {
        throw new NotAuthorizedError(doc.key);
    }
    await db.save(TABLE, doc);
}

export async function getPost(key: string): Promise<PostDocument> {
    var doc = await db.get<PostDocument>(TABLE, key);
    if (doc === null) {
        throw new PostNotFoundError(key);
    }
    return doc;
}

export async function listPost(filter: Partial<PostDocument>): Promise<PostListEntry[]> {
    var docs = await db.query<PostDocument>(TABLE, filter, ["key", "userid", "rule", "recruitEndDate", "sessionDate"]);
    // TODO: pagination 
    return docs as PostListEntry[];
}