import { createSession, DEMO_ACCOUNTS, isDemoAccount, requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { findUserByEmail, toSessionUser } from "@/lib/users";

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

  const limited = await rateLimit("write", user.id);
  if (limited) return limited;

  try {
    const targetRole = user.role === "employee" ? "it_staff" : "employee";
    const target = await findUserByEmail(DEMO_ACCOUNTS[targetRole]);
    if (!target) throw new Error(`Demo account missing for role ${targetRole}; has the seed run?`);

    const sessionUser = toSessionUser(target);
    await createSession(sessionUser); // replaces the old cookie
    // Logged as the account switched TO, so it shows up as that person's sign-in.
    await logActivity({
      action: "role_switched",
      userId: target.id,
      ticketId: null,
      details: `${user.firstName} switched to ${target.first_name} (demo)`,
    });
    return Response.json({ user: sessionUser });
  } catch (err) {
    console.error("POST /api/auth/demo-switch failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
