import { query } from "@/lib/db";

// GET /api/departments: list all departments.
// TODO (Phase 2): require a logged-in user with requireUser(). It's public for
// now only because sessions don't exist yet and Phase 1 tests it in the browser.
export async function GET() {
  try {
    const departments = await query<{ id: number; name: string }>(
      "SELECT id, name FROM departments ORDER BY id"
    );
    return Response.json({ departments });
  } catch (err) {
    // Details stay in the server console; the client gets a generic message.
    console.error("GET /api/departments failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
