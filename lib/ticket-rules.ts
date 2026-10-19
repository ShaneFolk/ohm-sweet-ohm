import { z } from "zod";

// Ticket rules that both the server and the browser use: allowed values and
// input validation. No database code here, so client components can import it.

export const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;

export const NewTicketSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(TITLE_MAX, `At most ${TITLE_MAX} characters`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `At most ${DESCRIPTION_MAX} characters`)
    .optional()
    .transform((d) => (d ? d : null)), // empty -> null
  priority: z.enum(PRIORITIES).default("medium"),
});
// z.object() drops any keys it doesn't list, so a body that sneaks in
// submitted_by, status, or assigned_to has them silently ignored.

export type NewTicket = z.infer<typeof NewTicketSchema>;

export const NOTE_MAX = 1000;

export const NewNoteSchema = z.object({
  note: z.string().trim().min(1, "Write something first").max(NOTE_MAX, `At most ${NOTE_MAX} characters`),
});

/**
 * THE visibility rule, used by every ticket and note query:
 * employees only see tickets they submitted; IT staff see everything.
 * Returns the user ID to filter on, or null for "no filter".
 */
export function ownerFilter(user: { id: number; role: "employee" | "it_staff" }) {
  return user.role === "it_staff" ? null : user.id;
}

// Ticket IDs from the URL. Capped at Postgres's INT maximum so a huge number
// is a clean 404 instead of a database error.
export const TicketIdSchema = z.coerce.number().int().positive().max(2147483647);
