import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { listActivity, LOG_FILTERS } from "@/lib/activity";

const FilterParam = z.enum(LOG_FILTERS).default("all");

// GET /api/activity-logs?filter=all|tickets|logins
// Latest 100 entries, newest first. IT staff only.
export async function GET(request: Request) {
  const user = await requireRole("it_staff");
  if (user instanceof Response) return user;

  const raw = new URL(request.url).searchParams.get("filter") ?? undefined;
  const filter = FilterParam.safeParse(raw);
  if (!filter.success) {
    return Response.json({ error: `filter must be one of: ${LOG_FILTERS.join(", ")}` }, { status: 400 });
  }

  try {
    return Response.json({ logs: await listActivity(user, filter.data) });
  } catch (err) {
    console.error("GET /api/activity-logs failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
