export interface User {
  /** Internal unique id (uuid). Partition key in DynamoDB. */
  id: string;
  /** Google account id (the OpenID `sub`) — the only data taken from Google. */
  googleId: string;
  /** User-chosen, unique display name. */
  username: string;
  /** URL of a user-uploaded profile image (optional). */
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape safe to expose to clients. */
export type PublicUser = Pick<
  User,
  "id" | "username" | "profileImageUrl" | "createdAt"
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
  };
}
