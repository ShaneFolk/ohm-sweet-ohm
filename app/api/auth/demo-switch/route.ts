import { createSession, DEMO_ACCOUNTS, isDemoAccount, requireUser } from "@/lib/auth";
import { findUserByEmail, toSessionUser } from "@/lib/users";

// TODO (Phase 5): rate-limit like other writes.

// POST /api/auth/demo-switch (no body)
// Penny <-> Rex. Only works if you're already logged in as one of them; the
// server decides who you become, so nobody can switch into a real account.
export async function POST() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  // The email comes from the signed session cookie, so it can't be faked.
  if (!isDemoAccount(user.email)) {
    return Response.json({ error: "Only demo accounts can switch roles" }, { status: 403 });
  }

  try {
    const targetRole = user.role === "employee" ? "it_staff" : "employee";
    const target = await findUserByEmail(DEMO_ACCOUNTS[targetRole]);
    if (!target) throw new Error(`Demo account missing for role ${targetRole}; has the seed run?`);

    const sessionUser = toSessionUser(target);
    await createSession(sessionUser); // replaces the old cookie
    return Response.json({ user: sessionUser });
  } catch (err) {
    console.error("POST /api/auth/demo-switch failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
