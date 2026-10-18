import { isDemoAccount, requireUser } from "@/lib/auth";

// GET /api/auth/me: who is logged in. Comes from the signed session cookie,
// so there's no database call and no password hash anywhere near it.
export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  return Response.json({ user: { ...user, isDemo: isDemoAccount(user.email) } });
}
