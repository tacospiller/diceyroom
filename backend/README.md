# backend

Node.js web server built with Express and TypeScript, with Google OAuth login
and persistent (Redis-backed) sessions.

## Stack

- **Express + TypeScript** — HTTP server
- **Passport (`passport-google-oauth20`)** — Google OAuth login/registration
- **DynamoDB** (AWS SDK v3) — user store
- **JWT** — stateless, short-lived access tokens (Bearer header)
- **Redis** — persistent session store holding refresh tokens (revocable, survives restarts)

## Requirements

- Node.js >= 20
- Google OAuth credentials ([console](https://console.cloud.google.com/apis/credentials))
  with `http://localhost:3000/auth/google/callback` as an authorized redirect URI
- **Only when `PERSISTENCE=aws`:** a Redis instance (`REDIS_URL`) and DynamoDB
  (real AWS, or [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
  via `DYNAMODB_ENDPOINT`)

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
| `npm run db:init`   | Create the Users DynamoDB table + GSI        |

## Auth endpoints

| Method | Path                    | Auth          | Description                                            |
| ------ | ----------------------- | ------------- | ----------------------------------------------------- |
| GET    | `/auth/google`          | —             | Start Google OAuth (redirects to Google)              |
| GET    | `/auth/google/callback` | —             | OAuth callback; sets refresh cookie, redirects to app |
| POST   | `/auth/refresh`         | refresh cookie| Rotate refresh token, return new access token + user  |
| POST   | `/auth/logout`          | refresh cookie| Revoke the refresh token, clear the cookie            |
| GET    | `/auth/me`              | Bearer token  | Return the current user                               |

### Login / registration flow

1. Frontend sends the user to **`GET /auth/google`**.
2. Google authenticates and redirects to **`/auth/google/callback`**.
   The user is looked up by `googleId` in DynamoDB — created on first login
   (registration), profile-refreshed on later logins.
3. The server issues:
   - an opaque **refresh token** → SHA-256 hashed and stored in Redis with a TTL,
     delivered as an **httpOnly cookie** (`refresh_token`, scoped to `/auth`);
   - the browser is redirected to `${CLIENT_URL}/auth/callback`.
4. The SPA calls **`POST /auth/refresh`** (cookie sent automatically) to get a
   short-lived **access token** (JWT) + the user object.
5. The SPA calls protected APIs with `Authorization: Bearer <accessToken>`.
   When the access token expires, it calls `/auth/refresh` again.

Refresh tokens **rotate** on every `/auth/refresh` and can be revoked
individually (logout) or all at once per user
(`revokeAllForUser` in `tokenService`). Because they live in Redis, sessions
persist across server restarts.

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
  services/
    authService.ts            # AuthService — find-or-create user from Google profile
    tokenService.ts           # TokenService — JWT access + refresh tokens (rotate/revoke)
  routes/
    health.ts                 # GET /health
    auth.ts                   # OAuth + session endpoints
  middleware/
    requireAuth.ts            # Bearer access-token guard
    notFound.ts               # 404 handler
    errorHandler.ts           # centralized error handler
  scripts/createTable.ts      # DynamoDB table bootstrap
  utils/fileJson.ts           # atomic JSON file read/write
  types/express.d.ts          # Express Request/User augmentation
```
