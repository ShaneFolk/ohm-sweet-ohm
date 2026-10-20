import "server-only";
import { query } from "./db";
import { logActivity } from "./activity";
import { CAPS, CapError } from "./caps";
import type { SessionUser } from "./session-token";
import { ownerFilter } from "./ticket-rules";

// Ticket notes. Anyone who can see a ticket (its owner, or IT staff) can read
// and add its notes; nobody else can tell the ticket exists.

export type Note = {
  id: number;
  note: string;
  created_at: Date;
  user_id: number;
  user_name: string;
};

const SELECT_NOTES = `
  SELECT n.id, n.note, n.created_at, n.user_id, u.first_name || ' ' || u.last_name AS user_name
  FROM ticket_notes n JOIN users u ON u.id = n.user_id`;

// "This ticket exists and this user may see it." $1 = ticket id, $2 = owner filter.
const CAN_SEE_TICKET = "EXISTS (SELECT 1 FROM tickets WHERE id = $1 AND ($2::int IS NULL OR submitted_by = $2))";

/** Notes for a ticket the caller has ALREADY checked access to (getTicket does). */
export function fetchNotes(ticketId: number) {
  return query<Note>(`${SELECT_NOTES} WHERE n.ticket_id = $1 ORDER BY n.created_at ASC, n.id ASC`, [ticketId]);
}

/** Notes on a ticket, or null if the ticket doesn't exist or isn't visible to this user. */
export async function listNotes(user: SessionUser, ticketId: number): Promise<Note[] | null> {
  const ok = await query<{ ok: boolean }>(`SELECT ${CAN_SEE_TICKET} AS ok`, [ticketId, ownerFilter(user)]);
  if (!ok[0].ok) return null;
  return fetchNotes(ticketId);
}

/**
 * Add a note as this user. Null = no access / no ticket. Throws CapError when
 * a cap is reached. Access is checked first, so a cap message never reveals
 * that someone else's ticket exists.
 */
export async function addNote(user: SessionUser, ticketId: number, text: string): Promise<Note | null> {
  const [check] = await query<{ ok: boolean; on_ticket: number; total: number }>(
    `SELECT ${CAN_SEE_TICKET} AS ok,
            (SELECT count(*) FROM ticket_notes WHERE ticket_id = $1)::int AS on_ticket,
            (SELECT count(*) FROM ticket_notes)::int AS total`,
    [ticketId, ownerFilter(user)]
  );
  if (!check.ok) return null;
  if (check.total >= CAPS.totalNotes) {
    throw new CapError("The demo is full for today. It resets every night, so please try again tomorrow.");
  }
  if (check.on_ticket >= CAPS.notesPerTicket) {
    throw new CapError(`This ticket has reached the limit of ${CAPS.notesPerTicket} notes.`);
  }

  // The access check is repeated inside the insert, so there's no gap
  // between "may I?" and "do it".
  const rows = await query<{ id: number }>(
    `INSERT INTO ticket_notes (ticket_id, user_id, note)
     SELECT $1::int, $3::int, $4::text WHERE ${CAN_SEE_TICKET}
     RETURNING id`,
    [ticketId, ownerFilter(user), user.id, text]
  );
  if (!rows[0]) return null;

  await logActivity({
    action: "note_added",
    userId: user.id,
    ticketId,
    details: `${user.firstName} added a note to ticket #${ticketId}`,
  });

  const [note] = await query<Note>(`${SELECT_NOTES} WHERE n.id = $1`, [rows[0].id]);
  return note;
}
