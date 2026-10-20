import "server-only";
import { query } from "./db";
import { logActivity } from "./activity";
import type { SessionUser } from "./session-token";
import { ownerFilter, type NewTicket, type Priority, type Status } from "./ticket-rules";
import { fetchNotes, type Note } from "./notes";
import { isDemoAccount } from "./auth";
import { CAPS, CapError, hashIp } from "./caps";

// All ticket reads and writes, with the permission rules built in.
// API routes AND pages call these, so "employees only see their own tickets"
// lives in exactly one place. Allowed values and validation are in ticket-rules.ts.

export * from "./ticket-rules";

// Timestamps come back from the driver as Date objects (JSON turns them into strings).
export type TicketSummary = {
  id: number;
  title: string;
  priority: Priority;
  status: Status;
  created_at: Date;
  updated_at: Date;
  submitted_by: number;
  submitted_by_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  department_name: string | null;
};

export type { Note };

export type TicketDetail = TicketSummary & { description: string | null; notes: Note[] };

// ---------- Queries ----------

// Shared SELECT with the joined names. $1 = owner filter (null = everyone).
const SELECT_TICKETS = `
  SELECT t.id, t.title, t.priority, t.status, t.created_at, t.updated_at,
         t.submitted_by, s.first_name || ' ' || s.last_name AS submitted_by_name,
         t.assigned_to,  a.first_name || ' ' || a.last_name AS assigned_to_name,
         d.name AS department_name
  FROM tickets t
  JOIN users s ON s.id = t.submitted_by
  LEFT JOIN users a ON a.id = t.assigned_to
  LEFT JOIN departments d ON d.id = t.department_id`;

export async function listTickets(user: SessionUser, status?: Status) {
  return query<TicketSummary>(
    `${SELECT_TICKETS}
     WHERE ($1::int IS NULL OR t.submitted_by = $1)
       AND ($2::text IS NULL OR t.status = $2)
     ORDER BY t.created_at DESC`,
    [ownerFilter(user), status ?? null]
  );
}

/**
 * One ticket with its notes, or null if it doesn't exist OR this user isn't
 * allowed to see it. Callers return 404 either way, so nobody can probe
 * which ticket IDs exist.
 */
export async function getTicket(user: SessionUser, id: number): Promise<TicketDetail | null> {
  const rows = await query<TicketSummary & { description: string | null }>(
    `SELECT x.*, t.description
     FROM (${SELECT_TICKETS} WHERE t.id = $2 AND ($1::int IS NULL OR t.submitted_by = $1)) x
     JOIN tickets t ON t.id = x.id`,
    [ownerFilter(user), id]
  );
  const ticket = rows[0];
  if (!ticket) return null;

  // Only reached once we know the user may see this ticket.
  return { ...ticket, notes: await fetchNotes(id) };
}

/**
 * Create a ticket. submitted_by and department come from the session user,
 * never the request body; status always starts as "open".
 * Throws CapError when a cap is reached. `ip` is the visitor's IP address.
 */
export async function createTicket(user: SessionUser, input: NewTicket, ip: string) {
  // Everyone using a demo account shares one user, so for them the open-ticket
  // cap counts per visitor (hashed IP) instead of per account.
  const ipHash = isDemoAccount(user.email) ? hashIp(ip) : null;

  const [counts] = await query<{ total: number; open: number }>(
    `SELECT (SELECT count(*) FROM tickets)::int AS total,
            (SELECT count(*) FROM tickets
             WHERE submitted_by = $1 AND status IN ('open', 'in_progress')
               AND ($2::text IS NULL OR submitter_ip_hash = $2))::int AS open`,
    [user.id, ipHash]
  );
  if (counts.total >= CAPS.totalTickets) {
    throw new CapError("The demo is full for today. It resets every night, so please try again tomorrow.");
  }
  if (counts.open >= CAPS.openTicketsPerUser) {
    throw new CapError(
      `You already have ${CAPS.openTicketsPerUser} open tickets. Please wait for some to be resolved before opening more.`
    );
  }

  const rows = await query<{ id: number }>(
    `INSERT INTO tickets (title, description, priority, submitted_by, department_id, submitter_ip_hash)
     VALUES ($1, $2, $3, $4, (SELECT department_id FROM users WHERE id = $4), $5)
     RETURNING id`,
    [input.title, input.description, input.priority, user.id, ipHash]
  );
  const id = rows[0].id;

  await logActivity({
    action: "ticket_created",
    userId: user.id,
    ticketId: id,
    details: `${user.firstName} created ticket #${id}: ${input.title}`,
    detailsJson: { priority: input.priority },
  });
  return id;
}
