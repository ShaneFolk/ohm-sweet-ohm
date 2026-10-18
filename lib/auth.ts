import "server-only"; // build error if this file is ever imported into browser code
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_HOURS,
  signSessionToken,
  verifySessionToken,
  type Role,
  type SessionUser,
} from "./session-token";

export type { Role, SessionUser };

// The two accounts behind "Log in as demo employee / IT tech" and the
// "Viewing as" toggle. The server picks the account; the browser only sends a role.
export const DEMO_ACCOUNTS: Record<Role, string> = {
  employee: "penny@tomorrow-industries.test",
  it_staff: "rex@tomorrow-industries.test",
};

export function isDemoAccount(email: string) {
  return Object.values(DEMO_ACCOUNTS).includes(email);
}

const BCRYPT_COST = 12;

// ---------- Passwords ----------

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// ---------- Session cookie (signed JWT) ----------

/** Sign the user into a JWT and store it in an httpOnly cookie. Route Handlers only. */
export async function createSession(user: SessionUser) {
  (await cookies()).set(COOKIE_NAME, await signSessionToken(user), {
    httpOnly: true, // page JavaScript can't read it, so injected scripts can't steal it
    secure: process.env.NODE_ENV === "production", // HTTPS only once deployed
    sameSite: "lax", // not sent on cross-site form posts, which blocks most CSRF
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

/** Remove the session cookie (log out). Route Handlers only. */
export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * Who is logged in, or null. Checks the JWT's signature and expiry.
 * A tampered, expired, or missing cookie all count as "not logged in".
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  return verifySessionToken((await cookies()).get(COOKIE_NAME)?.value);
}

// ---------- Guards for API routes ----------
// They return either the user or a ready-made error Response:
//
//   const user = await requireUser();
//   if (user instanceof Response) return user;

/** 401 unless someone is logged in. */
export async function requireUser(): Promise<SessionUser | Response> {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Please log in" }, { status: 401 });
  return user;
}

/** 401 if logged out, 403 if logged in with the wrong role. */
export async function requireRole(role: Role): Promise<SessionUser | Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (user.role !== role) {
    return Response.json({ error: "You don't have permission to do that" }, { status: 403 });
  }
  return user;
}
