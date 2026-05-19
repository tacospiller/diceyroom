import { apiClient } from './client'

export type PostMode = 'text' | 'voice' | 'offline' | 'other'
type UserId = string;

interface PostDocument {
    key: string;
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
    super(`Post not found: ${key}`)
    this.name = 'PostNotFoundError'
  }
}

export async function listPosts(
  filter: Partial<PostDocument> = {},
): Promise<PostListEntry[]> {
  const res = await apiClient.get<PostListEntry[]>('/post/list', {
    params: filter,
  })
  return res.data
}

export async function getPost(postid: string): Promise<PostDocument> {
  try {
    const res = await apiClient.get<PostDocument>(`/post/post/${postid}`)
    return res.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) throw new PostNotFoundError(postid)
    throw err
  }
}

export async function createPost(input: PostCreationRequest): Promise<void> {
  await apiClient.post('/post/add', input)
}

export async function editPost(input: PostCreationRequest): Promise<void> {
  await apiClient.post('/post/edit', input)
}
