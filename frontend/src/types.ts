export interface User {
  id: string;
  username: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface SessionResponse {
  accessToken: string;
  user: User | null;
}
