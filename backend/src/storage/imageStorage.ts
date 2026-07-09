export interface UploadedImage {
  data: Buffer;
  contentType: string;
}

/**
 * Persistence boundary for uploaded images. Implemented by S3ImageStorage
 * (production) and LocalImageStorage (local dev).
 */
export interface ImageStorage {
  /** Store an image and return its public URL. */
  saveProfileImage(image: UploadedImage): Promise<string>;
}

/** Map an accepted image content type to a file extension. */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionFor(contentType: string): string {
  return IMAGE_EXTENSIONS[contentType] ?? "bin";
}
