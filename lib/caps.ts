import "server-only";
import { createHmac } from "node:crypto";

// Hard caps from PLAN.md. They keep the demo inside Neon's free plan even if
// someone spams it all day (the nightly reset clears everything anyway).
export const CAPS = {
  openTicketsPerUser: 10, // statuses open + in_progress
  totalTickets: 300,
  notesPerTicket: 20,
  totalNotes: 1000,
} as const;

/** Thrown when a cap is reached. Routes turn it into a 429 with this message. */
export class CapError extends Error {}

/** The 429 Response for a CapError. */
export function capResponse(err: CapError) {
  return Response.json({ error: err.message }, { status: 429 });
}

/**
 * One-way hash of an IP address. It can tell two visitors apart but can't be
 * turned back into the IP. Keyed with SESSION_SECRET, so it can't be guessed
 * by hashing every possible IP either.
 */
export function hashIp(ip: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}
