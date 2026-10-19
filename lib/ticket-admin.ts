import "server-only";
import { z } from "zod";
import { query, transaction } from "./db";
import { logActivity } from "./activity";
import type { SessionUser } from "./session-token";
import { PRIORITIES, STATUSES, type Priority, type Status } from "./ticket-rules";

// IT-staff-only ticket changes. The API routes check the role first, and each
// function checks again, so a future caller that forgets can't let an
// employee through.

function assertIT(user: SessionUser) {
  if (user.role !== "it_staff") throw new Error("IT staff only");
}

// ---------- Change status / priority ----------

export const UpdateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .refine((b) => b.status || b.priority, { message: "Send a status and/or a priority" });

type UpdateResult = {
  id: number;
  title: string;
  old_status: Status;
  status: Status;
  old_priority: Priority;
  priority: Priority;
};

/** Returns the before/after values, or null if the ticket doesn't exist. */
export async function updateTicket(
  user: SessionUser,
  id: number,
  changes: z.infer<typeof UpdateTicketSchema>
) {
  assertIT(user);
  // One statement that grabs the old values and applies the new ones.
  // COALESCE keeps a field as-is when it wasn't sent.
  const rows = await query<UpdateResult>(
    `UPDATE tickets t
     SET status = COALESCE($2, t.status), priority = COALESCE($3, t.priority)
     FROM (SELECT id, status AS old_status, priority AS old_priority
           FROM tickets WHERE id = $1 FOR UPDATE) old
     WHERE t.id = old.id
     RETURNING t.id, t.title, old.old_status, t.status, old.old_priority, t.priority`,
    [id, changes.status ?? null, changes.priority ?? null]
  );
  const r = rows[0];
  if (!r) return null;

  if (r.old_status !== r.status) {
    await logActivity({
      action: "status_changed",
      userId: user.id,
      ticketId: id,
      details: `${user.firstName} changed ticket #${id} status from ${r.old_status} to ${r.status}`,
      detailsJson: { from: r.old_status, to: r.status },
    });
  }
  if (r.old_priority !== r.priority) {
    await logActivity({
      action: "priority_changed",
      userId: user.id,
      ticketId: id,
      details: `${user.firstName} changed ticket #${id} priority from ${r.old_priority} to ${r.priority}`,
      detailsJson: { from: r.old_priority, to: r.priority },
    });
  }
  return r;
}

// ---------- Delete ----------

/** Deletes the ticket (notes and assignments cascade). False if it didn't exist. */
export async function deleteTicket(user: SessionUser, id: number) {
  assertIT(user);
  const rows = await query<{ id: number; title: string }>(
    "DELETE FROM tickets WHERE id = $1 RETURNING id, title",
    [id]
  );
  if (!rows[0]) return false;

  // activity_logs has no foreign keys, so this entry survives the delete.
  await logActivity({
    action: "ticket_deleted",
    userId: user.id,
    ticketId: id,
    details: `${user.firstName} deleted ticket #${id}: ${rows[0].title}`,
  });
  return true;
}

// ---------- Assign a tech ----------

export const AssignSchema = z.object({
  assigned_to: z.number().int().positive().max(2147483647),
});

export type AssignResult = "ok" | "ticket_not_found" | "not_it_staff";

export async function assignTicket(user: SessionUser, id: number, techId: number): Promise<AssignResult> {
  assertIT(user);

  const techs = await query<{ name: string }>(
    "SELECT first_name || ' ' || last_name AS name FROM users WHERE id = $1 AND role = 'it_staff'",
    [techId]
  );
  if (!techs[0]) return "not_it_staff";

  // Both writes in one transaction: either the ticket is assigned AND the
  // history row exists, or neither happens. The it_staff check is repeated
  // inside the SQL so it holds even if someone's role changed a moment ago.
  const IS_TECH = "EXISTS (SELECT 1 FROM users WHERE id = $2 AND role = 'it_staff')";
  const [updated] = (await transaction([
    {
      text: `UPDATE tickets SET assigned_to = $2 WHERE id = $1 AND ${IS_TECH} RETURNING id`,
      params: [id, techId],
    },
    {
      text: `INSERT INTO ticket_assignments (ticket_id, assigned_to, assigned_by)
             SELECT $1::int, $2::int, $3::int
             WHERE EXISTS (SELECT 1 FROM tickets WHERE id = $1 AND assigned_to = $2) AND ${IS_TECH}`,
      params: [id, techId, user.id],
    },
  ])) as unknown[][];
  if (updated.length === 0) return "ticket_not_found";

  await logActivity({
    action: "ticket_assigned",
    userId: user.id,
    ticketId: id,
    details: `${user.firstName} assigned ticket #${id} to ${techs[0].name}`,
    detailsJson: { assigned_to: techId },
  });
  return "ok";
}
