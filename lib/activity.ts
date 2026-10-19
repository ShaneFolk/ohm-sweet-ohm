import "server-only";
import { query } from "./db";
import type { SessionUser } from "./session-token";

export type ActivityEntry = {
  id: number;
  action: string;
  user_id: number | null;
  user_name: string | null; // null if that user no longer exists
  ticket_id: number | null;
  details: string;
  created_at: Date;
};

/** The latest 100 log entries, newest first. IT staff only. */
export async function listActivity(user: SessionUser) {
  if (user.role !== "it_staff") throw new Error("IT staff only");
  // LEFT JOIN: the log has no foreign keys, so the user may be gone.
  return query<ActivityEntry>(
    `SELECT l.id, l.action, l.user_id, u.first_name AS user_name, l.ticket_id, l.details, l.created_at
     FROM activity_logs l LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT 100`
  );
}

type Activity = {
  action: string; // e.g. "ticket_created"
  userId: number;
  ticketId: number | null;
  details: string; // human-readable, shown on the activity log page
  detailsJson?: Record<string, unknown>; // any extra structured info
};

/**
 * Record something in activity_logs. Never throws: if logging fails, the
 * user's action still succeeds and the error goes to the server console.
 */
export async function logActivity(a: Activity) {
  try {
    await query(
      `INSERT INTO activity_logs (action, user_id, ticket_id, details, details_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [a.action, a.userId, a.ticketId, a.details, a.detailsJson ? JSON.stringify(a.detailsJson) : null]
    );
  } catch (err) {
    console.error("Activity log insert failed:", err);
  }
}
