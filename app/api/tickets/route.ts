import { requireUser } from "@/lib/auth";
import { createTicket, getTicket, listTickets, NewTicketSchema, STATUSES } from "@/lib/tickets";
import { capResponse, CapError } from "@/lib/caps";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validate";
import { z } from "zod";

const StatusFilter = z.enum(STATUSES).optional();

// GET /api/tickets?status=open
// Employees get their own tickets; IT staff get all of them.
export async function GET(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const raw = new URL(request.url).searchParams.get("status") ?? undefined;
  const status = StatusFilter.safeParse(raw);
  if (!status.success) {
    return Response.json({ error: `status must be one of: ${STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    const tickets = await listTickets(user, status.data);
    return Response.json({ tickets });
  } catch (err) {
    console.error("GET /api/tickets failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/tickets  { title, description?, priority? }
export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = await rateLimit("ticket", user.id);
  if (limited) return limited;

  const body = await parseBody(request, NewTicketSchema);
  if (body instanceof Response) return body;

  try {
    const id = await createTicket(user, body, clientIp(request));
    const ticket = await getTicket(user, id);
    return Response.json({ ticket }, { status: 201 });
  } catch (err) {
    if (err instanceof CapError) return capResponse(err);
    console.error("POST /api/tickets failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
