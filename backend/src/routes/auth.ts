import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { env } from "../config/env";
import { requireAuth } from "../middleware/requireAuth";
import { toPublicUser, User } from "../models/user";
import { REFRESH_TTL_MS } from "../services/tokenService";
import { tokenService, userRepository } from "../container";

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

// Step 1: kick off the Google OAuth flow.
authRouter.get(
  "/google",
  passport.authenticate("google", { session: false, scope: ["profile", "email"] })
);

// Step 2: Google redirects back here. Issue tokens and hand off to the frontend.
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth`,
  }),
  async (req: Request, res: Response) => {
    const user = req.user as User;
    const refreshToken = await tokenService.issueRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);
    // Access token is fetched by the SPA via POST /auth/refresh using the cookie.
    res.redirect(`${env.CLIENT_URL}/auth/callback`);
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
