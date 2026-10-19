import { requireRole } from "@/lib/auth";
import { listActivity } from "@/lib/activity";

// GET /api/activity-logs: latest 100 entries, newest first. IT staff only.
export async function GET() {
  const user = await requireRole("it_staff");
  if (user instanceof Response) return user;

  try {
    return Response.json({ logs: await listActivity(user) });
  } catch (err) {
    console.error("GET /api/activity-logs failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
