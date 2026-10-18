import { SignJWT, jwtVerify } from "jose";

// Signing and checking the session JWT. Kept separate from lib/auth.ts because
// proxy.ts needs it too, and the proxy can't use next/headers' cookies().

export type Role = "employee" | "it_staff";

// What we keep in the session cookie. No password hash, ever.
export type SessionUser = {
  id: number;
  email: string;
  firstName: string;
  role: Role;
};

export const COOKIE_NAME = "ohm_session";
export const SESSION_HOURS = 8;

// Read lazily so `next build` doesn't need the secret.
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export function signSessionToken(user: SessionUser) {
  return new SignJWT({ email: user.email, firstName: user.firstName, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

/** The user inside a valid token, or null if it's missing, tampered with, or expired. */
export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const role = payload.role;
    if (!Number.isInteger(id) || (role !== "employee" && role !== "it_staff")) return null;
    return { id, email: String(payload.email), firstName: String(payload.firstName), role };
  } catch {
    return null;
  }
}
