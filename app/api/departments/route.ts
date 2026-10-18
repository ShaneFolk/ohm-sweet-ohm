import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// GET /api/departments: list all departments. Any logged-in user.
export async function GET() {
  // Reading the session cookie also tells Next.js this route runs per request,
  // so it never tries to run the database query at build time.
  const user = await requireUser();
  if (user instanceof Response) return user;

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
