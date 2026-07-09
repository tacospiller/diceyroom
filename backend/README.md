# backend

Node.js web server built with Express and TypeScript. Users authenticate with
Google (used **only** to obtain the Google account id) and complete an explicit
registration where they choose their own username and optional profile image.
Sessions are persistent (refresh tokens in a session store).

## Stack

- **Express + TypeScript** — HTTP server
- **Passport (`passport-google-oauth20`)** — Google identity (scope `openid` only)
- **DynamoDB** (AWS SDK v3) — user store
- **S3 / local disk** — profile-image uploads
- **JWT** — stateless, short-lived access tokens (Bearer header)
- **Redis** — persistent session store holding refresh tokens (revocable, survives restarts)

## What we store about a user

Only these fields — nothing is pulled from Google except the account id:

- `id` — internal uuid
- `googleId` — the Google account id (OpenID `sub`)
- `username` — user-chosen, **unique**
- `profileImageUrl` — optional, from a user-uploaded image
- `createdAt` / `updatedAt`

Google is asked for `openid` scope only, so the server never receives the
user's email, name, or photo.

## Requirements

- Node.js >= 20
- Google OAuth credentials ([console](https://console.cloud.google.com/apis/credentials))
  with `http://localhost:3000/auth/google/callback` as an authorized redirect URI
- **Only when `PERSISTENCE=aws`:** a Redis instance (`REDIS_URL`), DynamoDB
  (real AWS, or [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
  via `DYNAMODB_ENDPOINT`), and an S3 bucket (`S3_BUCKET`) for image uploads

## Persistence backends

Storage is behind two interfaces so implementations are swappable via the
`PERSISTENCE` env var — no external services are needed for local dev:

| `PERSISTENCE` | Users                  | Sessions             |
| ------------- | ---------------------- | -------------------- |
| `file`        | `FileUserRepository`   | `FileSessionStore`   |
| `aws`         | `DynamoUserRepository` | `RedisSessionStore`  |

- Interfaces: [`UserRepository`](src/repositories/userRepository.ts), [`SessionStore`](src/stores/sessionStore.ts)
- Implementations are selected in the composition root, [`container.ts`](src/container.ts)
- `file` mode stores users and sessions as JSON files under `DATA_DIR`
  (default `./.data`, git-ignored). Data persists across restarts and connects
  to neither Redis nor DynamoDB — ideal for local dev.

## Setup

### Local dev (no external services)

```bash
cd backend
npm install
cp .env.example .env      # defaults to PERSISTENCE=file; add Google creds + JWT secret
npm run dev               # data is written to ./.data (git-ignored)
```

### AWS-backed (DynamoDB + Redis)

```bash
cd backend
npm install
cp .env.example .env      # set PERSISTENCE=aws + AWS/Redis/Google/JWT values
npm run db:init           # create the Users DynamoDB table (idempotent)
npm run dev
```

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start dev server with hot reload (tsx watch) |
| `npm run build`     | Compile TypeScript to `dist/`                |
| `npm start`         | Run the compiled server from `dist/`         |
| `npm run typecheck` | Type-check without emitting                  |
| `npm run lint`      | Lint the source with ESLint                  |
| `npm run db:init`   | Create the Users DynamoDB table + GSIs       |

## Auth endpoints

| Method | Path                       | Auth           | Description                                                        |
| ------ | -------------------------- | -------------- | ----------------------------------------------------------------- |
| GET    | `/auth/google`             | —              | Start Google OAuth (redirects to Google)                          |
| GET    | `/auth/google/callback`    | —              | Callback. Existing user → login; new user → redirect to register  |
| GET    | `/auth/username-available` | —              | `?username=` → `{ available: boolean }`                           |
| POST   | `/auth/register`           | reg. ticket    | Complete registration (multipart form; see below)                 |
| POST   | `/auth/refresh`            | refresh cookie | Rotate refresh token, return new access token + user              |
| POST   | `/auth/logout`             | refresh cookie | Revoke the refresh token, clear the cookie                        |
| GET    | `/auth/me`                 | Bearer token   | Return the current user                                           |

### Login vs. registration flow

1. Frontend sends the user to **`GET /auth/google`**.
2. Google authenticates and redirects to **`/auth/google/callback`**. The server
   receives **only the `googleId`** and looks it up:
   - **Existing user** → issues a session (refresh cookie) and redirects to
     `${CLIENT_URL}/auth/callback` (logged in).
   - **New user** → mints a short-lived **registration ticket** (a signed JWT,
     15 min) and redirects to `${CLIENT_URL}/register#ticket=<ticket>`.
3. On the registration page the user picks a **username** (checked via
   `/auth/username-available`) and optionally an image, then submits
   **`POST /auth/register`** as `multipart/form-data`:
   - `registrationTicket` (text) — from the redirect fragment
   - `username` (text) — 3–20 chars, `[a-zA-Z0-9_]`, must be unique
   - `profileImage` (file, optional) — PNG/JPEG/WebP/GIF, ≤ `MAX_UPLOAD_MB`
   The server verifies the ticket, uploads the image (S3 or local disk), creates
   the user, and returns `{ accessToken, user }` (201) + sets the refresh cookie.
4. The SPA calls protected APIs with `Authorization: Bearer <accessToken>`, and
   uses **`POST /auth/refresh`** (cookie sent automatically) to get a fresh
   access token when it expires.

Refresh tokens **rotate** on every `/auth/refresh` and can be revoked
individually (logout) or all at once per user (`revokeAllForUser` in
`TokenService`). Because they live in the session store, sessions persist across
server restarts.

## Profile-image storage

Uploads go through the [`ImageStorage`](src/storage/imageStorage.ts) interface,
selected by `PERSISTENCE`:

| `PERSISTENCE` | Implementation      | Where images go                               |
| ------------- | ------------------- | --------------------------------------------- |
| `file`        | `LocalImageStorage` | `UPLOAD_DIR`, served at `/uploads/<file>`     |
| `aws`         | `S3ImageStorage`    | `S3_BUCKET` (optionally fronted by `S3_PUBLIC_URL`) |

## Structure

```
src/
  index.ts                     # entry point + graceful shutdown (container.disconnect)
  app.ts                       # Express app factory (middleware, passport, routes)
  container.ts                 # composition root — picks impls by PERSISTENCE
  config/
    env.ts                     # env loading/validation
    passport.ts                # Google OAuth strategy
  db/
    dynamo.ts                  # DynamoDB document client
    redis.ts                   # Redis client factory
  models/user.ts               # User type + public projection
  repositories/
    userRepository.ts          # UserRepository interface + input types
    dynamoUserRepository.ts    # DynamoDB implementation
    fileUserRepository.ts      # local JSON-file implementation (dev)
  stores/
    sessionStore.ts            # SessionStore interface (refresh tokens)
    redisSessionStore.ts       # Redis implementation
    fileSessionStore.ts        # local JSON-file implementation (dev)
  storage/
    imageStorage.ts            # ImageStorage interface (profile images)
    s3ImageStorage.ts          # S3 implementation
    localImageStorage.ts       # local-disk implementation (dev)
  services/
    authService.ts            # AuthService — registration tickets + registerGoogleUser
    tokenService.ts           # TokenService — JWT access + refresh tokens (rotate/revoke)
  routes/
    health.ts                 # GET /health
    auth.ts                   # OAuth + registration + session endpoints
  middleware/
    requireAuth.ts            # Bearer access-token guard
    upload.ts                 # multer profile-image upload (memory, validated)
    notFound.ts               # 404 handler
    errorHandler.ts           # centralized error handler
  scripts/createTable.ts      # DynamoDB table bootstrap (GoogleId + Username GSIs)
  utils/
    fileJson.ts               # atomic JSON file read/write
    httpError.ts              # HttpError (status-carrying error)
  types/express.d.ts          # Express Request/User augmentation
```
