export interface User {
  /** Internal unique id (uuid). Partition key in DynamoDB. */
  id: string;
  /** Google account id (the OAuth `sub`). Unique per Google account. */
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape safe to expose to clients. */
export type PublicUser = Pick<
  User,
  "id" | "email" | "name" | "avatarUrl" | "createdAt"
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
