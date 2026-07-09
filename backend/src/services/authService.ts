import { UserRepository } from "../repositories/userRepository";
import { User } from "../models/user";

export interface GoogleProfileData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /**
   * Find the user for a Google account, creating them on first login
   * (registration) and refreshing their profile on subsequent logins.
   */
  async findOrCreateGoogleUser(profile: GoogleProfileData): Promise<User> {
    const existing = await this.users.findByGoogleId(profile.googleId);

    if (!existing) {
      return this.users.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
    }

    const changed =
      existing.email !== profile.email ||
      existing.name !== profile.name ||
      existing.avatarUrl !== profile.avatarUrl;

    if (changed) {
      return this.users.updateProfile(existing.id, {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
    }

    return existing;
  }
}
