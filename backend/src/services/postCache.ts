import cache from "../cache";
import config from "../config";
import db from "../db";
import { getPostStatus, PostDocument } from "./documents/PostDocument";
import { groupBy, intersectionBy } from "es-toolkit";
import { PostId, PostStatus, UserId } from "./ids";
import { PostFilterRequest, PostListEntryResponse } from "./DTO/postDTOs";

const TABLE = config.tables.posts;

const CREATEDKEY = "createdAt";
const RULEKEY = "rule";
const MODEKEY = "mode";
const AUTHORKEY = "author";
const POSTKEY = "post";

function ruleKey(rule: string) {
    return `${RULEKEY}.${rule}`;
}

function modeKey(mode: string) {
    return `${MODEKEY}.${mode}`;
}

function authorKey(authorId: UserId) {
    return `${AUTHORKEY}.${authorId}`;
}

function postKey(postId: PostId, field: string) {
    return `${POSTKEY}.${postId}.${field}`;
}

function toCacheItem(post: PostDocument) {
    return { member: post.key, score: post.createdAt.getDate() };
}


export async function initializePostCache(): Promise<void> {
    var posts = await db.query<PostDocument>(TABLE);

    await cache.zset(CREATEDKEY, posts.map(toCacheItem));

    var ruleGroups = groupBy(posts, (item) => item.rule);
    for (var rule in ruleGroups) {
        var posts = ruleGroups[rule];
        await cache.zset(ruleKey(rule), posts.map(toCacheItem));
    }

    var modeGroups = groupBy(posts, (item) => item.sessionMode);
    for (var mode in modeGroups) {
        var posts = modeGroups[mode];
        await cache.zset(modeKey(mode), posts.map(toCacheItem));
    }

    var authorGroups = groupBy(posts, (item) => item.authorId);
    for (var author in authorGroups) {
        var posts = authorGroups[author];
        await cache.sset(authorKey(author), posts.map(x => x.key));
    }

    for (var post of posts) {
        await cache.set(postKey(post.key, "recruitEndsAt"), post.recruitEndsAt);
        await cache.set(postKey(post.key, "status"), getPostStatus(post));
    }
}

export async function addPostToCache(post: PostDocument): Promise<void> {
    await cache.zset(CREATEDKEY, [toCacheItem(post)]);
    await cache.zset(ruleKey(post.rule), [toCacheItem(post)]);
    await cache.sadd(authorKey(post.authorId), [post.key]);
    await cache.set(postKey(post.key, "recruitEndsAt"), post.recruitEndsAt);
    await cache.set(postKey(post.key, "status"), getPostStatus(post));
}

export async function removePostFromCache(post: PostDocument): Promise<void> {
    await cache.zrem(CREATEDKEY, [post.key]);
    await cache.zrem(ruleKey(post.rule), [post.key]);
    await cache.srem(authorKey(post.authorId), [post.key]);
    await cache.delete(postKey(post.key, "recruitEndsAt"));
    await cache.delete(postKey(post.key, "status"));
}

export async function updatePostInCache(prevPost: PostDocument, afterPost: PostDocument): Promise<void> {
    if (prevPost.rule !== afterPost.rule) {
        await cache.zrem(ruleKey(prevPost.rule), [prevPost.key]);
        await cache.zadd(ruleKey(afterPost.rule), [toCacheItem(afterPost)]);
    }

    if (prevPost.recruitEndsAt !== afterPost.recruitEndsAt) {
        await cache.set(postKey(afterPost.key, "recruitEndsAt"), afterPost.recruitEndsAt);
    }
    await cache.set(postKey(afterPost.key, "status"), getPostStatus(afterPost));
}

function filter<T>(mapper: (item: T) => any, ...lists: (T[] | null)[]): T[] | null {
    if (lists.length === 0) {
        return null;
    }
    if (lists.length === 1) {
        return lists[0];
    }

    var listA = lists[0];
    var listB = filter(mapper, ...lists.slice(1));

    if (listA && listB) {
        return intersectionBy(listA, listB, mapper);
    }
    if (listA && !listB) {
        return listA;
    }
    return listB;
}

export async function filterFromCache(postFilter: PostFilterRequest): Promise<PostId[]> {
    var authorFiltered = postFilter.authorId ? await cache.zget(authorKey(postFilter.authorId)) : null;
    var ruleFiltered = postFilter.rule ? await cache.zget(ruleKey(postFilter.rule)) : null;
    var modeFiltered = postFilter.sessionMode ? await cache.zget(modeKey(postFilter.sessionMode)) : null;

    var filtered = filter((item) => item.member, authorFiltered, ruleFiltered, modeFiltered) ?? [];
    
    if (!postFilter.status) {
        return filtered.slice((postFilter.page - 1) * postFilter.pageSize, postFilter.page * postFilter.pageSize).map(x => x.member);
    }

    var endDates = await cache.mget<Date | undefined>(filtered.map(x => postKey(x.member, "recruitEndsAt")));
    var statuses = await cache.mget<PostStatus | undefined>(filtered.map(x => postKey(x.member, "status")));

    var finalList = [];
    for (var i = 0; i < filtered.length; i++) {
        var status = PostStatus.Open;
        if (endDates[i] && endDates[i]! < new Date()) {
            status = PostStatus.Closed;
        } else if (statuses[i] === PostStatus.Full) {
            status = PostStatus.Full;
        }
        if (status === postFilter.status) {
            finalList.push(filtered[i].member);
        }
    }

    return finalList.slice((postFilter.page - 1) * postFilter.pageSize, postFilter.page * postFilter.pageSize);
}

export async function loadFromCache(postId: PostId): Promise<PostListEntryResponse | undefined> {
    var entry = await cache.get<PostListEntryResponse>(postKey(postId, "entry"));
    if (entry) {
        return entry;
    }

    var doc = await db.get<PostDocument>(TABLE, postId);
    if (doc) {
        var generatedEntry = {
            postId: doc.key,
            rule: doc.rule,
            title: doc.title,
            sessionMode: doc.sessionMode,
            
            gmCount: doc.gmCount,
            playerCount: doc.playerCount,
            participantCount: doc.participantCount,
            participants: doc.participants?.map(x => x.participantType),
            
            status: getPostStatus(doc),
        };
        await cache.set(postKey(postId, "entry"), generatedEntry);
        return generatedEntry;
    }

    return undefined;
}