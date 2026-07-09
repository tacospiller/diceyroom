import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  ImageStorage,
  UploadedImage,
  extensionFor,
} from "./imageStorage";

const KEY_PREFIX = "profile-images";

/**
 * Stores profile images in an S3 bucket. For production (PERSISTENCE=aws).
 */
export class S3ImageStorage implements ImageStorage {
  private readonly s3: S3Client;

  constructor(
    private readonly bucket: string,
    private readonly region: string,
    /** Optional CDN/custom base URL; defaults to the S3 virtual-hosted URL. */
    private readonly publicBaseUrl?: string
  ) {
    if (!bucket) {
      throw new Error("S3_BUCKET must be set when PERSISTENCE=aws");
    }
    this.s3 = new S3Client({ region });
  }

  async saveProfileImage(image: UploadedImage): Promise<string> {
    const key = `${KEY_PREFIX}/${randomUUID()}.${extensionFor(
      image.contentType
    )}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: image.data,
        ContentType: image.contentType,
      })
    );

    const base =
      this.publicBaseUrl?.replace(/\/$/, "") ??
      `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `${base}/${key}`;
  }
}
