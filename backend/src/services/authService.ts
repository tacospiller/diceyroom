import jwt, { SignOptions } from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository";
import { User } from "../models/user";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

/** How long a user has to complete registration after Google sign-in. */
const REGISTRATION_TICKET_TTL = "15m";
const REGISTRATION_PURPOSE = "google_registration";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

interface RegistrationTicketPayload {
  googleId: string;
  purpose: typeof REGISTRATION_PURPOSE;
}

export interface RegisterInput {
  registrationTicket: string;
  username: string;
  profileImageUrl?: string;
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /** Look up the account for a Google id (null if not yet registered). */
  findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.findByGoogleId(googleId);
  }

  // ---- Registration tickets --------------------------------------------------

  /**
   * Issue a short-lived signed ticket proving the holder completed Google
   * sign-in as `googleId`, without yet creating an account.
   */
  createRegistrationTicket(googleId: string): string {
    const payload: RegistrationTicketPayload = {
      googleId,
      purpose: REGISTRATION_PURPOSE,
    };
    const options: SignOptions = { expiresIn: REGISTRATION_TICKET_TTL };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  }

  private verifyRegistrationTicket(ticket: string): string {
    let decoded: RegistrationTicketPayload;
    try {
      decoded = jwt.verify(
        ticket,
        env.JWT_ACCESS_SECRET
      ) as RegistrationTicketPayload;
    } catch {
      throw new HttpError(401, "Invalid or expired registration ticket");
    }
    if (decoded.purpose !== REGISTRATION_PURPOSE || !decoded.googleId) {
      throw new HttpError(401, "Invalid registration ticket");
    }
    return decoded.googleId;
  }

  // ---- Username --------------------------------------------------------------

  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!USERNAME_RE.test(username)) return false;
    return (await this.users.findByUsername(username)) === null;
  }

  // ---- Registration ----------------------------------------------------------

  /** Complete registration: consume the ticket + chosen username/image. */
  async registerGoogleUser(input: RegisterInput): Promise<User> {
    const googleId = this.verifyRegistrationTicket(input.registrationTicket);

    const username = input.username.trim();
    if (!USERNAME_RE.test(username)) {
      throw new HttpError(
        400,
        "Username must be 3-20 characters: letters, numbers, or underscore"
      );
    }

    // One account per Google id.
    if (await this.users.findByGoogleId(googleId)) {
      throw new HttpError(409, "This Google account is already registered");
    }
    // Usernames are unique.
    if (await this.users.findByUsername(username)) {
      throw new HttpError(409, "That username is taken");
    }

    return this.users.create({
      googleId,
      username,
      profileImageUrl: input.profileImageUrl,
    });
  }
}
