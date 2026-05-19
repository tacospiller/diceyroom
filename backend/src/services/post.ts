import config from "../config";
import db from "../db";
import { DBDocument } from "../db/Database";
import { customAlphabet } from "nanoid";
import { alphanumeric } from 'nanoid-dictionary';


const TABLE = config.tables.posts;
const genUid = customAlphabet(alphanumeric, 6);

type UserId = string;

interface PostDocument extends DBDocument {
    authorId: UserId;
    rule: string;
    title: string;
    description?: string;
    createdAt: Date;
    recruitEndsAt?: Date | string;
    
    sessionMode: string;
    sessionLocation?: string;
    sessionDateType: string; // fixed, range, autodate
    sessionFixedDate?: Date; // present if fixed
    sessionRangeDetails?: string; // present if range


    gmLimit: number;
    playerLimit: number;
    gm?: UserId[];
    players?: UserId[];
    publishParticipants: boolean;
    acceptJoinRequests: boolean;
}

interface PostListEntry {
    key: string;
    authorId: UserId;
    rule: string;
    title: string;
    createdAt: Date;
    recruitEndsAt?: Date | string;
    
    sessionMode: string;

    gmLimit: number;
    playerLimit: number;
    gmCount: number;
    playerCount: number;
}

export interface PostCreationRequest {
    rule: string;
    title: string;
    description?: string;
    recruitEndsAt?: Date | string;
    
    sessionMode: string;
    sessionLocation?: string;
    sessionDateType: string; // fixed, range, autodate
    sessionFixedDate?: Date; // present if fixed
    sessionRangeDetails?: string; // present if range

    gmLimit: number;
    playerLimit: number;
    publishParticipants: boolean;
    acceptJoinRequests: boolean;
    authorParticipateType: string; // gm, player, none
}

export interface PostFilter {
    authorId?: UserId;
    rule?: string;
    sessionMode?: string;
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

export async function createPost(author: UserId, req: PostCreationRequest) {
    var { authorParticipateType, ...spreadReq } = req;
    var doc: PostDocument = {
        key: genUid(),
        authorId: author,
        createdAt: new Date(),
        gm: authorParticipateType === "gm" ? [author] : [],
        players: authorParticipateType === "player" ? [author] : [],
        ...spreadReq
    };

    await db.create(TABLE, doc);
}

export async function editPost(author: UserId, postKey: string, req: PostCreationRequest) {
    var checkDoc = await db.get<PostDocument>(TABLE, postKey);
    if (checkDoc === null) {
        throw new PostNotFoundError(postKey);
    }
    if (checkDoc.authorId !== author) {
        throw new NotAuthorizedError(postKey);
    }

    var { authorParticipateType, ...spreadReq } = req;

    var doc = {
        ...checkDoc,
        ...spreadReq
    };

    await db.save(TABLE, doc);
}

export async function getPost(userId: UserId, key: string): Promise<PostDocument> {
    var doc = await db.get<PostDocument>(TABLE, key);
    if (doc === null) {
        throw new PostNotFoundError(key);
    }

    var hideInformation = doc.authorId !== userId;
    if (hideInformation && !doc.publishParticipants) {
        doc.gm = doc.gm?.map(x => "--unknown--");
        doc.players = doc.players?.map(x => "--unknown--");
    }

    return doc;
}

export async function listPost(filter: PostFilter): Promise<PostListEntry[]> {
    var docs = await db.query<PostDocument>(TABLE, filter, ["key", "authorId", "title", "rule", "sessionMode", "recruitEndsAt", "playerLimit", "players", "gmLimit", "gm"]);
    var entries = docs.map(x => {
        var { gm, players, ...spread } = x;
        return {
            gmCount: gm?.length ?? 0,
            playerCount: players?.length ?? 0,
            ...spread
        };
    });

    return entries as PostListEntry[];
}