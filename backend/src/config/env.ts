import dotenv from "dotenv";

dotenv.config();

function parsePort(value: string | undefined, fallback: number): number {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function parseInt10(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const NODE_ENV = process.env.NODE_ENV ?? "development";

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === "production",
  PORT: parsePort(process.env.PORT, 3000),

  // Persistence backend. "aws" = DynamoDB + Redis; "file" = local JSON files
  // for local dev (no external services; data persists under DATA_DIR).
  PERSISTENCE: (optional("PERSISTENCE", "aws") === "file"
    ? "file"
    : "aws") as "file" | "aws",

  // Directory for the "file" persistence backend (relative to the process cwd).
  DATA_DIR: optional("DATA_DIR", "./.data"),

  // Where the browser gets redirected back to after a successful login.
  CLIENT_URL: optional("CLIENT_URL", "http://localhost:5173"),

  // This server's own public base URL (used to build uploaded-image URLs).
  PUBLIC_URL: optional("PUBLIC_URL", "http://localhost:3000"),

  // Google OAuth
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: optional(
    "GOOGLE_CALLBACK_URL",
    "http://localhost:3000/auth/google/callback"
  ),

  // JWT (stateless access token)
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_ACCESS_TTL: optional("JWT_ACCESS_TTL", "15m"),

  // Refresh token / persistent session (stored in Redis)
  REFRESH_TTL_DAYS: parseInt10(optional("REFRESH_TTL_DAYS", "30"), 30),
  REFRESH_COOKIE_NAME: optional("REFRESH_COOKIE_NAME", "refresh_token"),

  // AWS / DynamoDB
  AWS_REGION: optional("AWS_REGION", "us-east-1"),
  DYNAMODB_TABLE: optional("DYNAMODB_TABLE", "Users"),
  // Set for DynamoDB Local, e.g. http://localhost:8000. Empty = real AWS.
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || undefined,

  // Redis
  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),

  // Profile-image uploads
  MAX_UPLOAD_MB: parseInt10(optional("MAX_UPLOAD_MB", "5"), 5),
  // Local image storage (PERSISTENCE=file): directory served at /uploads.
  UPLOAD_DIR: optional("UPLOAD_DIR", "./.data/uploads"),
  // S3 image storage (PERSISTENCE=aws): bucket + optional custom public base.
  S3_BUCKET: optional("S3_BUCKET", ""),
  S3_PUBLIC_URL: optional("S3_PUBLIC_URL", ""),
} as const;
