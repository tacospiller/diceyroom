import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { env } from "../config/env";
import { requireAuth } from "../middleware/requireAuth";
import { uploadProfileImage } from "../middleware/upload";
import { toPublicUser, User } from "../models/user";
import { REFRESH_TTL_MS } from "../services/tokenService";
import {
  tokenService,
  userRepository,
  authService,
  imageStorage,
} from "../container";

export const authRouter = Router();

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(env.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/auth",
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, { path: "/auth" });
}

/** Issue a session for an API client: refresh cookie + access token in the body. */
async function respondWithSession(
  res: Response,
  user: User,
  status = 200
): Promise<void> {
  const refreshToken = await tokenService.issueRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);
  const accessToken = tokenService.signAccessToken(user.id);
  res.status(status).json({ accessToken, user: toPublicUser(user) });
}

// Step 1: kick off the Google OAuth flow.
authRouter.get(
  "/google",
  passport.authenticate("google", { session: false, scope: ["openid"] })
);

// Step 2: Google redirects back here. We only receive the googleId.
// Existing account -> log in. New account -> hand off to registration.
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth`,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { googleId } = req.user as { googleId: string };
      const existing = await authService.findByGoogleId(googleId);

      if (existing) {
        const refreshToken = await tokenService.issueRefreshToken(existing.id);
        setRefreshCookie(res, refreshToken);
        // SPA fetches the access token via POST /auth/refresh using the cookie.
        res.redirect(`${env.CLIENT_URL}/auth/callback`);
        return;
      }

      // Not registered yet: pass a short-lived ticket to the registration page.
      const ticket = authService.createRegistrationTicket(googleId);
      res.redirect(
        `${env.CLIENT_URL}/register#ticket=${encodeURIComponent(ticket)}`
      );
    } catch (err) {
      next(err);
    }
  }
);

// Check whether a username is free (for the registration form).
authRouter.get(
  "/username-available",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.query.username;
      if (typeof username !== "string") {
        res.status(400).json({ error: "username query param is required" });
        return;
      }
      res.json({ available: await authService.isUsernameAvailable(username) });
    } catch (err) {
      next(err);
    }
  }
);

// Complete registration: multipart/form-data with `registrationTicket`,
// `username`, and an optional `profileImage` file.
authRouter.post(
  "/register",
  uploadProfileImage,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { registrationTicket, username } = req.body ?? {};
      if (
        typeof registrationTicket !== "string" ||
        typeof username !== "string"
      ) {
        res
          .status(400)
          .json({ error: "registrationTicket and username are required" });
        return;
      }

      let profileImageUrl: string | undefined;
      if (req.file) {
        profileImageUrl = await imageStorage.saveProfileImage({
          data: req.file.buffer,
          contentType: req.file.mimetype,
        });
      }

      const user = await authService.registerGoogleUser({
        registrationTicket,
        username,
        profileImageUrl,
      });
      await respondWithSession(res, user, 201);
    } catch (err) {
      next(err);
    }
  }
);

// Exchange a valid refresh cookie for a new access token (rotates the refresh token).
authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const current = req.cookies?.[env.REFRESH_COOKIE_NAME];
      if (!current) {
        res.status(401).json({ error: "No refresh token" });
        return;
      }

      const rotated = await tokenService.rotateRefreshToken(current);
      if (!rotated) {
        clearRefreshCookie(res);
        res.status(401).json({ error: "Invalid or expired refresh token" });
        return;
      }

      setRefreshCookie(res, rotated.token);
      const accessToken = tokenService.signAccessToken(rotated.userId);
      const user = await userRepository.findById(rotated.userId);
      res.json({
        accessToken,
        user: user ? toPublicUser(user) : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Log out on the current device: revoke the refresh token and clear the cookie.
authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const current = req.cookies?.[env.REFRESH_COOKIE_NAME];
      if (current) {
        await tokenService.revokeRefreshToken(current);
      }
      clearRefreshCookie(res);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// Current authenticated user (requires Bearer access token).
authRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userRepository.findById(req.auth!.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);
