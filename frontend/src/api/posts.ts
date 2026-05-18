import { apiClient } from './client'

export type PostMode = 'text' | 'voice' | 'offline' | 'other'

export interface PostDocument {
  key: string
  userid: string
  rule: string
  title: string
  description: string
  mode: PostMode
  sessionDate: string
  recruitEndDate: string
  creationDate: string
}

export interface PostListEntry {
  key: string
  rule: string
  title: string
  mode: PostMode
  sessionDate: string
  recruitEndDate: string
}

export type PostCreateInput = Omit<PostDocument, 'key' | 'userid' | 'creationDate'>
export type PostEditInput = Omit<PostDocument, 'userid' | 'creationDate'>

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

export async function createPost(input: PostCreateInput): Promise<void> {
  await apiClient.post('/post/add', input)
}

export async function editPost(input: PostEditInput): Promise<void> {
  await apiClient.post('/post/edit', input)
}
