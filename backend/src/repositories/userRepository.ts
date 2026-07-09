import { User } from "../models/user";

export interface CreateUserInput {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface UpdateProfileInput {
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Persistence boundary for users. Implemented by DynamoUserRepository
 * (production) and InMemoryUserRepository (local dev / tests).
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updateProfile(id: string, fields: UpdateProfileInput): Promise<User>;
}
