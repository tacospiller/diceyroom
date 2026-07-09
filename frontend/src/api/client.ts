import type { SessionResponse } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Error thrown for non-2xx responses, carrying the server's message + status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<never> {
  let message = res.statusText;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    // response had no JSON body; keep statusText
  }
  throw new ApiError(res.status, message);
}

/** Full-page URL to start the Google OAuth flow. */
export function googleAuthUrl(): string {
  return `${BASE}/auth/google`;
}

/** Exchange the refresh cookie for an access token + user (or 401 if none). */
export async function refresh(): Promise<SessionResponse> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

/** Complete registration with the ticket + chosen username + optional image. */
export async function register(input: {
  registrationTicket: string;
  username: string;
  profileImage?: File | null;
}): Promise<SessionResponse> {
  const form = new FormData();
  form.append("registrationTicket", input.registrationTicket);
  form.append("username", input.username);
  if (input.profileImage) form.append("profileImage", input.profileImage);

  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

/** Check whether a username is free. */
export async function usernameAvailable(username: string): Promise<boolean> {
  const res = await fetch(
    `${BASE}/auth/username-available?username=${encodeURIComponent(username)}`,
    { credentials: "include" }
  );
  if (!res.ok) return parseError(res);
  const body = (await res.json()) as { available: boolean };
  return body.available;
}

/** Revoke the current refresh token and clear the cookie. */
export async function logout(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
