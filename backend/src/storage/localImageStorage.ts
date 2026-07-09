import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  ImageStorage,
  UploadedImage,
  extensionFor,
} from "./imageStorage";

/**
 * Stores profile images on the local disk under `uploadDir` and serves them
 * from `${publicBaseUrl}/uploads/<file>` (the app serves `uploadDir` statically
 * at /uploads). For local development.
 */
export class LocalImageStorage implements ImageStorage {
  constructor(
    private readonly uploadDir: string,
    private readonly publicBaseUrl: string
  ) {}

  async saveProfileImage(image: UploadedImage): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${randomUUID()}.${extensionFor(image.contentType)}`;
    await writeFile(join(this.uploadDir, filename), image.data);
    return `${this.publicBaseUrl.replace(/\/$/, "")}/uploads/${filename}`;
  }
}
