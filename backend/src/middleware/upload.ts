import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { env } from "../config/env";
import { IMAGE_EXTENSIONS } from "../storage/imageStorage";
import { HttpError } from "../utils/httpError";

/**
 * Parse a single optional `profileImage` file from multipart/form-data into
 * memory (so it can be handed to the ImageStorage), rejecting non-images and
 * files above MAX_UPLOAD_MB.
 */
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in IMAGE_EXTENSIONS) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Profile image must be PNG, JPEG, WebP, or GIF"));
    }
  },
}).single("profileImage");

/** Multer middleware that maps upload errors (e.g. too large) to HTTP 400. */
export function uploadProfileImage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  parser(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      next(new HttpError(400, err.message));
    } else if (err) {
      next(err); // HttpError from the fileFilter, or an unexpected error
    } else {
      next();
    }
  });
}
