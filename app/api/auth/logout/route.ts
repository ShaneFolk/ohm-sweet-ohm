import { clearSession, requireUser } from "@/lib/auth";

// POST /api/auth/logout: clears the session cookie.
export async function POST() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  await clearSession();
  return Response.json({ ok: true });
}
