# backend

Node.js web server built with Express and TypeScript.

## Requirements

- Node.js >= 20

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start dev server with hot reload (tsx watch) |
| `npm run build`     | Compile TypeScript to `dist/`                |
| `npm start`         | Run the compiled server from `dist/`         |
| `npm run typecheck` | Type-check without emitting                  |
| `npm run lint`      | Lint the source with ESLint                  |

## Structure

```
src/
  index.ts              # Server entry point + graceful shutdown
  app.ts                # Express app factory (middleware + routes)
  config/env.ts         # Environment variable loading/validation
  routes/health.ts      # GET /health
  middleware/
    notFound.ts         # 404 handler
    errorHandler.ts     # Centralized error handler
```

## Health check

```bash
curl http://localhost:3000/health
```
