import type { User as AppUser } from "../models/user";

declare global {
  namespace Express {
    // Passport populates req.user; type it as our application User.
    interface User extends AppUser {}

    interface Request {
      auth?: { userId: string };
    }
  }
}

export {};
