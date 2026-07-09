# frontend

Vue 3 + TypeScript (Vite) single-page app for the diceyroom auth flow.

It renders one of three states:

1. **Not authenticated** → a "Sign in with Google" button.
2. **Authenticated but not registered** → a "Create profile" form (username +
   optional profile image).
3. **Authenticated and registered** → "Hello world" (with username, avatar, and
   a log-out button).

## Requirements

- Node.js >= 20
- The [backend](../backend) running (default `http://localhost:3000`)

## Setup

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL if the backend isn't on :3000
npm run dev               # serves on http://localhost:5173
```

`http://localhost:5173` must match the backend's `CLIENT_URL` so OAuth redirects
and CORS (with credentials) line up.

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Type-check (`vue-tsc`) + production build |
| `npm run preview`   | Preview the production build         |
| `npm run typecheck` | Type-check only                      |

## How it maps to the backend

The backend drives navigation via redirects; the SPA reacts to them:

- **Sign in** — the button does a full-page navigation to `GET /auth/google`.
- **Existing user** — Google → backend `/auth/google/callback` → redirect to
  `/auth/callback`. [`AuthCallbackView`](src/views/AuthCallbackView.vue) calls
  `POST /auth/refresh` (sends the httpOnly refresh cookie) to load the session,
  then routes home.
- **New user** — backend redirects to `/register#ticket=<jwt>`.
  [`RegisterView`](src/views/RegisterView.vue) reads the ticket from the URL
  fragment and shows [`CreateProfileForm`](src/components/CreateProfileForm.vue),
  which checks username availability (`GET /auth/username-available`) and submits
  `POST /auth/register` as multipart (ticket + username + optional image).
- **Session** — [`HomeView`](src/views/HomeView.vue) calls `POST /auth/refresh`
  on load; success → registered → "Hello world", failure → sign-in button.

All API calls use `credentials: "include"` so the refresh cookie flows. The
access token is kept in memory in the Pinia [`auth` store](src/stores/auth.ts).

## Structure

```
src/
  main.ts                     # app bootstrap (Pinia + router)
  App.vue                     # <RouterView>
  styles.css                  # global styles
  types.ts                    # User / SessionResponse types
  api/client.ts               # fetch wrapper for the auth endpoints
  stores/auth.ts              # Pinia auth store (session/register/logout)
  router/index.ts             # routes: /, /login, /auth/callback, /register
  views/
    HomeView.vue              # sign-in button OR hello world
    RegisterView.vue          # reads #ticket, hosts the create-profile form
    AuthCallbackView.vue      # completes login for existing users
  components/
    GoogleSignInButton.vue
    CreateProfileForm.vue     # username availability + image upload
    HelloWorld.vue
```
