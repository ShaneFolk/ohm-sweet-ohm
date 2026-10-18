import bcrypt from "bcryptjs";
import { transaction, type Query } from "./db";

// Demo data for Tomorrow Industries. Used by `npm run seed` and (in Phase 5)
// the nightly reset route, so both always produce the same starting data.

const DEPARTMENTS = ["IT", "HR", "Finance", "Marketing"];

const USERS = [
  { first: "Dot", last: "Matrix", email: "dot@tomorrow-industries.test", role: "it_staff", dept: "IT" },
  { first: "Rex", last: "Voltage", email: "rex@tomorrow-industries.test", role: "it_staff", dept: "IT" },
  { first: "Gus", last: "Gearwhistle", email: "gus@tomorrow-industries.test", role: "it_staff", dept: "IT" },
  { first: "Penny", last: "Circuit", email: "penny@tomorrow-industries.test", role: "employee", dept: "HR" },
  { first: "Marge", last: "Mainframe", email: "marge@tomorrow-industries.test", role: "employee", dept: "Finance" },
  { first: "Chip", last: "Rockwell", email: "chip@tomorrow-industries.test", role: "employee", dept: "Marketing" },
];

// People are referred to by email and tickets by title; the SQL looks up the IDs.
// hoursAgo spreads the creation times out so the list looks lived-in.
const TICKETS = [
  {
    title: "Robo-butler keeps vacuuming the ceiling",
    description: "Started after last night's update. It's very thorough, but the ceiling is clean and the floor is not.",
    priority: "medium", status: "in_progress", by: "penny", to: "rex", dept: "HR", hoursAgo: 30,
  },
  {
    title: "Video phone only shows static",
    description: "Calls connect but the screen is all snow. I can hear the caller fine.",
    priority: "high", status: "open", by: "marge", to: "rex", dept: "Finance", hoursAgo: 20,
  },
  {
    title: "Punch card reader is eating my punch cards",
    description: "Third card this week. It makes a crunching noise and the card never comes back out.",
    priority: "low", status: "open", by: "marge", to: null, dept: "Finance", hoursAgo: 6,
  },
  {
    title: "Locked out of the Mainframe after password change",
    description: 'Changed my password this morning and now it says "ACCESS DENIED" in very large letters.',
    priority: "critical", status: "open", by: "chip", to: "dot", dept: "Marketing", hoursAgo: 3,
  },
  {
    title: "Need the new Calc-U-Tron installed",
    description: "Budget season is coming and I need the Calc-U-Tron 5000 on my workstation.",
    priority: "low", status: "resolved", by: "penny", to: "gus", dept: "HR", hoursAgo: 72,
  },
];

const NOTES = [
  { ticket: 0, by: "rex", note: "Rolled back the update. Robo-butler now vacuums the floor. Ceiling looks great though." },
  { ticket: 0, by: "penny", note: "Thank you! It's still humming the jingle from the commercial. Is that normal?" },
  { ticket: 1, by: "rex", note: "Static confirmed. Heading up to adjust the rooftop antenna. Hold all calls!" },
  { ticket: 3, by: "dot", note: "The very large letters are a security feature. Resetting your access now." },
  { ticket: 4, by: "gus", note: "Calc-U-Tron 5000 installed and humming. Please don't ask it to divide by zero again." },
];

const email = (name: string) => `${name}@tomorrow-industries.test`;
const userId = (n: number) => `(SELECT id FROM users WHERE email = $${n})`;
const ticketId = (n: number) => `(SELECT id FROM tickets WHERE title = $${n})`;

export async function seedDatabase() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("DEMO_PASSWORD must be set and at least 8 characters");
  }

  // Each user gets their own bcrypt hash (cost 12). The plain password is never stored.
  const hashes = await Promise.all(USERS.map(() => bcrypt.hash(password, 12)));

  const q: Query[] = [];

  // Wipe the demo data and restart IDs at 1. rate_limits is kept, but rows
  // older than an hour are cleaned up (the nightly reset runs this too).
  q.push({
    text: `TRUNCATE departments, users, tickets, ticket_assignments, ticket_notes, activity_logs
           RESTART IDENTITY CASCADE`,
  });
  q.push({ text: "DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour'" });

  for (const name of DEPARTMENTS) {
    q.push({ text: "INSERT INTO departments (name) VALUES ($1)", params: [name] });
  }

  USERS.forEach((u, i) => {
    q.push({
      text: `INSERT INTO users (first_name, last_name, email, password_hash, role, department_id)
             VALUES ($1, $2, $3, $4, $5, (SELECT id FROM departments WHERE name = $6))`,
      params: [u.first, u.last, u.email, hashes[i], u.role, u.dept],
    });
  });

  for (const t of TICKETS) {
    q.push({
      text: `INSERT INTO tickets (title, description, priority, status, submitted_by, assigned_to,
                                  department_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, ${userId(5)}, ${userId(6)},
                     (SELECT id FROM departments WHERE name = $7),
                     now() - make_interval(hours => $8), now() - make_interval(hours => $8))`,
      params: [t.title, t.description, t.priority, t.status, email(t.by), t.to ? email(t.to) : null, t.dept, t.hoursAgo],
    });

    // Assignment history row for each assigned ticket. Dot (IT lead) did the assigning.
    if (t.to) {
      q.push({
        text: `INSERT INTO ticket_assignments (ticket_id, assigned_to, assigned_by, assigned_at)
               VALUES (${ticketId(1)}, ${userId(2)}, ${userId(3)}, now() - make_interval(hours => $4))`,
        params: [t.title, email(t.to), email("dot"), t.hoursAgo - 1],
      });
    }
  }

  for (const n of NOTES) {
    q.push({
      text: `INSERT INTO ticket_notes (ticket_id, user_id, note) VALUES (${ticketId(1)}, ${userId(2)}, $3)`,
      params: [TICKETS[n.ticket].title, email(n.by), n.note],
    });
  }

  // A few activity log entries so the log page isn't empty.
  const logs = [
    { action: "ticket_created", by: "chip", ticket: 3, details: "Chip created a critical ticket" },
    { action: "ticket_assigned", by: "dot", ticket: 3, details: "Dot took the ticket" },
    { action: "ticket_assigned", by: "dot", ticket: 0, details: "Dot assigned the ticket to Rex" },
    { action: "status_changed", by: "rex", ticket: 0, details: "Rex changed status from open to in_progress" },
    { action: "status_changed", by: "gus", ticket: 4, details: "Gus changed status from in_progress to resolved" },
  ];
  for (const l of logs) {
    q.push({
      text: `INSERT INTO activity_logs (action, user_id, ticket_id, details, details_json)
             VALUES ($1, ${userId(2)}, ${ticketId(3)}, $4, $5)`,
      params: [l.action, email(l.by), TICKETS[l.ticket].title, l.details, JSON.stringify({ seeded: true })],
    });
  }

  await transaction(q);

  return {
    departments: DEPARTMENTS.length,
    users: USERS.length,
    tickets: TICKETS.length,
    notes: NOTES.length,
    logs: logs.length,
  };
}
