import { requireUser } from "@/lib/auth";
import { addNote, listNotes } from "@/lib/notes";
import { NewNoteSchema, TicketIdSchema } from "@/lib/ticket-rules";
import { capResponse, CapError } from "@/lib/caps";
import { rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validate";

const NOT_FOUND = { error: "Ticket not found" };

type Ctx = RouteContext<"/api/tickets/[id]/notes">;

async function ticketId(ctx: Ctx) {
  const id = TicketIdSchema.safeParse((await ctx.params).id);
  return id.success ? id.data : null;
}

// GET /api/tickets/123/notes: the ticket's owner or IT staff.
export async function GET(_request: Request, ctx: Ctx) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const id = await ticketId(ctx);
  if (!id) return Response.json(NOT_FOUND, { status: 404 });

  try {
    const notes = await listNotes(user, id);
    if (!notes) return Response.json(NOT_FOUND, { status: 404 });
    return Response.json({ notes });
  } catch (err) {
    console.error("GET /api/tickets/[id]/notes failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/tickets/123/notes  { note }: the ticket's owner or IT staff.
// The author is always the logged-in user, never something from the body.
export async function POST(request: Request, ctx: Ctx) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = await rateLimit("note", user.id);
  if (limited) return limited;

  const id = await ticketId(ctx);
  if (!id) return Response.json(NOT_FOUND, { status: 404 });

  const body = await parseBody(request, NewNoteSchema);
  if (body instanceof Response) return body;

  try {
    const note = await addNote(user, id, body.note);
    if (!note) return Response.json(NOT_FOUND, { status: 404 });
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    if (err instanceof CapError) return capResponse(err);
    console.error("POST /api/tickets/[id]/notes failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
