import { requireRole, requireUser } from "@/lib/auth";
import { deleteTicket, updateTicket, UpdateTicketSchema } from "@/lib/ticket-admin";
import { getTicket, TicketIdSchema } from "@/lib/tickets";
import { parseBody } from "@/lib/validate";

const NOT_FOUND = { error: "Ticket not found" };
const SERVER_ERROR = { error: "Something went wrong" };

type Ctx = RouteContext<"/api/tickets/[id]">;

/** The ticket ID from the URL, or null if it isn't a valid ID. */
async function ticketId(ctx: Ctx) {
  const id = TicketIdSchema.safeParse((await ctx.params).id);
  return id.success ? id.data : null;
}

// GET /api/tickets/123: one ticket with joined names and notes. Owner or IT.
// Someone else's ticket gets the same 404 as a ticket that doesn't exist.
export async function GET(_request: Request, ctx: Ctx) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const id = await ticketId(ctx);
  if (!id) return Response.json(NOT_FOUND, { status: 404 });

  try {
    const ticket = await getTicket(user, id);
    if (!ticket) return Response.json(NOT_FOUND, { status: 404 });
    return Response.json({ ticket });
  } catch (err) {
    console.error("GET /api/tickets/[id] failed:", err);
    return Response.json(SERVER_ERROR, { status: 500 });
  }
}

// PATCH /api/tickets/123  { status?, priority? }: IT staff only.
// TODO (Phase 5): rate-limit (30 writes/minute per user).
export async function PATCH(request: Request, ctx: Ctx) {
  const user = await requireRole("it_staff");
  if (user instanceof Response) return user;

  const id = await ticketId(ctx);
  if (!id) return Response.json(NOT_FOUND, { status: 404 });

  const body = await parseBody(request, UpdateTicketSchema);
  if (body instanceof Response) return body;

  try {
    const result = await updateTicket(user, id, body);
    if (!result) return Response.json(NOT_FOUND, { status: 404 });
    return Response.json({ ticket: await getTicket(user, id) });
  } catch (err) {
    console.error("PATCH /api/tickets/[id] failed:", err);
    return Response.json(SERVER_ERROR, { status: 500 });
  }
}

// DELETE /api/tickets/123: IT staff only. Notes and assignment history go with it.
// TODO (Phase 5): rate-limit (30 writes/minute per user).
export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await requireRole("it_staff");
  if (user instanceof Response) return user;

  const id = await ticketId(ctx);
  if (!id) return Response.json(NOT_FOUND, { status: 404 });

  try {
    const deleted = await deleteTicket(user, id);
    if (!deleted) return Response.json(NOT_FOUND, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tickets/[id] failed:", err);
    return Response.json(SERVER_ERROR, { status: 500 });
  }
}
