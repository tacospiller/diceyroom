import config from "../config";
import db from "../db";
import { customAlphabet } from "nanoid";
import { alphanumeric } from 'nanoid-dictionary';
import { getPostStatus, PostDocument } from "./documents/PostDocument";
import { PostBodyResponse, PostCreationRequest, PostFilterRequest, PostListEntryResponse, PostListResponse } from "./DTO/postDTOs";
import { PostId, UserId } from "./ids";

const TABLE = config.tables.posts;
const genUid = customAlphabet(alphanumeric, 6);

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

export async function createPost(author: UserId, req: PostCreationRequest): Promise<PostId> {
    var postId = genUid();
    var doc: PostDocument = {
        key: postId,
        authorId: author,
        createdAt: new Date(),
        ...req
    };
    await db.create(TABLE, doc);
    return postId;
}

export async function editPost(author: UserId, postKey: PostId, req: PostCreationRequest): Promise<PostId> {
    var checkDoc = await db.get<PostDocument>(TABLE, postKey);
    if (checkDoc === null) {
        throw new PostNotFoundError(postKey);
    }
    if (checkDoc.authorId !== author) {
        throw new NotAuthorizedError(postKey);
    }
    var doc = {
        ...checkDoc,
        ...req
    };
    await db.save(TABLE, doc);
    return postKey;
}

export async function getPost(userId: UserId, key: PostId): Promise<PostBodyResponse> {
    var doc = await db.get<PostDocument>(TABLE, key);
    if (doc === null) {
        throw new PostNotFoundError(key);
    }

    var hideInformation = doc.authorId !== userId;
    if (hideInformation && !doc.publishParticipants) {
        doc.participants = doc.participants.map(x => {
            if (x.userId !== doc?.authorId) {
                x.userId = "--unknown--";
            }
            return x;
        });
    }

    return doc;
}

export async function listPost(filter: PostFilterRequest): Promise<PostListResponse> {
    var docs = await db.query<PostDocument>(TABLE);
    const entries: PostListEntryResponse[] = docs.map(x => {
        return {
            postId: x.key,
            rule: x.rule,
            title: x.title,
            sessionMode: x.sessionMode,
            
            gmCount: x.gmCount,
            playerCount: x.playerCount,
            participantCount: x.participantCount,
            participants: x.participants?.map(x => x.participantType),
            
            status: getPostStatus(x),
        };
    });

    return {
        entries
    };
}