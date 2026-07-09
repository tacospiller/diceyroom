import { Request, Response, NextFunction } from "express";
import { tokenService } from "../container";

/**
 * Protect a route with a Bearer access token.
 * On success, sets req.auth = { userId }.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.auth = { userId: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
