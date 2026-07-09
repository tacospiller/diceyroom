import { User } from "../models/user";

export interface CreateUserInput {
  googleId: string;
  username: string;
  profileImageUrl?: string;
}

export interface UpdateProfileInput {
  username?: string;
  profileImageUrl?: string;
}

/**
 * Persistence boundary for users. Implemented by DynamoUserRepository
 * (production) and FileUserRepository (local dev).
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updateProfile(id: string, fields: UpdateProfileInput): Promise<User>;
}
