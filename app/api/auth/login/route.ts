import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { findUserByEmail, toSessionUser } from "@/lib/users";
import { parseBody } from "@/lib/validate";

// TODO (Phase 5): rate-limit to 5 attempts per minute per IP.

const LoginBody = z.object({
  email: z.string().trim().toLowerCase().max(100).pipe(z.email()),
  // bcrypt only reads the first 72 bytes; the cap stops huge bodies wasting CPU.
  password: z.string().min(1).max(200),
});

// A real bcrypt hash of a random throwaway password. Checking against it when the
// email doesn't exist makes a wrong email take as long as a wrong password, so
// response times don't reveal which emails have accounts.
const DUMMY_HASH = "$2b$12$mxS5SzxWz9hZTCf4O9tgN.ZaInq6g0WNEE3TcILdJGkaTWpLtpgtq";

const INVALID = { error: "Invalid email or password" };

// POST /api/auth/login  { email, password }
export async function POST(request: Request) {
  const body = await parseBody(request, LoginBody);
  if (body instanceof Response) return Response.json(INVALID, { status: 400 });

  try {
    const user = await findUserByEmail(body.email);
    const ok = await verifyPassword(body.password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) return Response.json(INVALID, { status: 401 });

    const sessionUser = toSessionUser(user);
    await createSession(sessionUser);
    return Response.json({ user: sessionUser });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
