import { requireRole } from "@/lib/auth";
import { assignTicket, AssignSchema } from "@/lib/ticket-admin";
import { getTicket, TicketIdSchema } from "@/lib/tickets";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validate";

// POST /api/tickets/123/assign  { assigned_to: <IT staff user id> }: IT staff only.
// Sets tickets.assigned_to and records who assigned whom in ticket_assignments,
// both in one transaction.
export async function POST(request: Request, ctx: RouteContext<"/api/tickets/[id]/assign">) {
  const user = await requireRole("it_staff");
  if (user instanceof Response) return user;

  const limited = await rateLimit("write", user.id);
  if (limited) return limited;

  const id = TicketIdSchema.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Ticket not found" }, { status: 404 });

  const body = await parseBody(request, AssignSchema);
  if (body instanceof Response) return body;

  try {
    const result = await assignTicket(user, id.data, body.assigned_to);
    if (result === "not_it_staff") {
      return Response.json({ error: "Tickets can only be assigned to IT staff" }, { status: 400 });
    }
    if (result === "ticket_not_found") {
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    }
    return Response.json({ ticket: await getTicket(user, id.data) });
  } catch (err) {
    console.error("POST /api/tickets/[id]/assign failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
