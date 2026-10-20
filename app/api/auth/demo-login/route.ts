import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { createSession, DEMO_ACCOUNTS } from "@/lib/auth";
import { findUserByEmail, toSessionUser } from "@/lib/users";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validate";

const DemoLoginBody = z.object({
  role: z.enum(["employee", "it_staff"]),
});

// POST /api/auth/demo-login  { role: "employee" | "it_staff" }
// Logs in as Penny (employee) or Rex (IT tech). The server picks the account, and
// no password is involved, so the demo password never reaches the browser.
export async function POST(request: Request) {
  const limited = await rateLimit("demo-login", clientIp(request));
  if (limited) return limited;

  const body = await parseBody(request, DemoLoginBody);
  if (body instanceof Response) return body;

  try {
    const user = await findUserByEmail(DEMO_ACCOUNTS[body.role]);
    if (!user) throw new Error(`Demo account missing for role ${body.role}; has the seed run?`);

    const sessionUser = toSessionUser(user);
    await createSession(sessionUser);
    await logActivity({
      action: "user_login",
      userId: user.id,
      ticketId: null,
      details: `${user.first_name} logged in (demo)`,
    });
    return Response.json({ user: sessionUser });
  } catch (err) {
    console.error("POST /api/auth/demo-login failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
