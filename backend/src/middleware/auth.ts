import { Request, Response, NextFunction } from 'express';
import '../types/session';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }
  next();
}
