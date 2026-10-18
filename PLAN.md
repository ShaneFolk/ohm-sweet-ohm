# Ohm Sweet Ohm IT Support — Project Plan

A retro-futuristic IT help desk for **Tomorrow Industries**, a fictional 1950s-style appliance company. Built with **Next.js + Neon (PostgreSQL) + Vercel**.
Goal: a working, deployed demo that a visitor can log into, with role-based access, hardening, and spam limits.

Work through the phases **in order**. Finish and test each phase before starting the next.

---

## Theme: "Atomic Age Appliance"

The optimistic 1950s "world of tomorrow" showroom: shiny, cheerful, a little ridiculous. Original style only.
**Do not use:** Vault-Tec or vault imagery, a thumbs-up cartoon mascot, Pip-Boy-style UI, or green-on-black terminal screens.

| Element | Direction |
|---|---|
| Background | Cream / warm off-white, like vintage appliance ads |
| Accent colors | Teal (primary), burnt orange (secondary), mustard yellow (highlight) |
| Text | Charcoal, not pure black |
| Status colors | Open = teal, In progress = mustard, Resolved = green, Closed = gray |
| Priority badges | Starburst shapes; `critical` is a red starburst |
| Cards | Rounded "appliance" panels with a subtle chrome/cream border |
| Accents | Atoms, boomerangs, starbursts used sparingly |
| Fonts (Google Fonts via `next/font`) | Bold retro display font for headings, clean sans-serif for body, **amber** monospace for the activity log "terminal" page |
| Copy tone | Playful '50s ad voice ("Your ticket is in good hands! A technician will be along shortly.") without getting in the way of clarity |
| Mascot (optional, Phase 6) | Original little robot: round head, antenna, one wrench hand |

Everything must stay readable: good contrast, and it works on mobile.

---

## Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js (latest, App Router, TypeScript) | Frontend and API in one project |
| Database | Neon (PostgreSQL), free plan | Serverless Postgres that works well with Vercel |
| DB driver | `@neondatabase/serverless` | Neon's driver, built for serverless functions |
| Hosting | Vercel (Hobby/free) | Deploys from GitHub on every push |
| Passwords | `bcryptjs` | Hashing; never store plain-text passwords |
| Sessions | `jose` (signed JWT in an httpOnly cookie) | Simple, easy-to-understand login |
| Validation | `zod` | Checks every request body before it touches the database |
| Styling | Tailwind CSS | Fast, clean UI |

**Not using:** Express (replaced by Next.js route handlers), MongoDB (notes and logs move into Postgres tables).

---

## Roles and permissions

There are two roles: `employee` and `it_staff`. **Every rule below is enforced on the server**, inside each API route. Hiding a button in the UI is not security.

| Action | Employee | IT staff |
|---|---|---|
| Log in / log out | Yes | Yes |
| Create a ticket | Yes | Yes |
| View tickets | **Only their own** | All |
| View one ticket's details | Only if they submitted it | Any |
| Add a note to a ticket | Only their own tickets | Any ticket |
| Assign a tech to a ticket | No | Yes (assignee must be `it_staff`) |
| Change status / priority | No | Yes |
| Delete a ticket | No | Yes |
| View activity logs | No | Yes |

---

## Database schema (PostgreSQL)

Converted from the class MySQL script. Changes from MySQL:
- `INT AUTO_INCREMENT` becomes `SERIAL`
- `ENUM(...)` becomes `TEXT` with a `CHECK` constraint
- `ON UPDATE CURRENT_TIMESTAMP` becomes a trigger
- `TIMESTAMP` becomes `TIMESTAMPTZ` (stores the time zone)
- `password` becomes `password_hash` (only the bcrypt hash is ever stored)
- Mongo's `ticket_notes` and `activity_logs` become regular tables
- Length limits are enforced in the database too, not just in the app

Save as `db/schema.sql` and run it in the Neon SQL Editor.

```sql
-- Departments: IT, HR, Finance, Marketing
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users: employees and IT staff
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL CHECK (char_length(first_name) <= 50),
  last_name TEXT NOT NULL CHECK (char_length(last_name) <= 50),
  email TEXT NOT NULL UNIQUE CHECK (char_length(email) <= 100),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'it_staff')),
  department_id INT REFERENCES departments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT CHECK (char_length(description) <= 2000),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  submitted_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  department_id INT REFERENCES departments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assignment history (who assigned which tech, and when)
CREATE TABLE ticket_assignments (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  assigned_to INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket notes (was a MongoDB collection in class)
CREATE TABLE ticket_notes (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL CHECK (char_length(note) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log (was a MongoDB collection in class)
-- No foreign keys on purpose, so the history survives when a ticket is deleted.
-- details_json (JSONB) holds any extra info, like Mongo's flexible fields did.
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  user_id INT,
  ticket_id INT,
  details TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limiting: one row per (key, time window). key looks like 'login:<ip>' or 'ticket:<userId>'
CREATE TABLE rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- Keep tickets.updated_at current (replaces MySQL's ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_set_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for the lookups the app does most
CREATE INDEX idx_tickets_submitted_by ON tickets(submitted_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_notes_ticket_id ON ticket_notes(ticket_id);
CREATE INDEX idx_logs_created_at ON activity_logs(created_at DESC);
```

---

## Seed data

Create `scripts/seed.ts`. It must **hash every password with bcrypt** before inserting (plain SQL can't do that, which is why this is a script). Make it safe to re-run: clear the tables first with `TRUNCATE ... RESTART IDENTITY CASCADE`, then insert.

**Departments:** IT, HR, Finance, Marketing

**Users** (the demo password for all of them comes from the `DEMO_PASSWORD` env var):

Emails use the `.test` domain, which is reserved for fake addresses and can never belong to a real person.

| Name | Email | Role | Department |
|---|---|---|---|
| Dot Matrix | dot@tomorrow-industries.test | it_staff | IT |
| Rex Voltage | rex@tomorrow-industries.test | it_staff | IT |
| Gus Gearwhistle | gus@tomorrow-industries.test | it_staff | IT |
| Penny Circuit | penny@tomorrow-industries.test | employee | HR |
| Marge Mainframe | marge@tomorrow-industries.test | employee | Finance |
| Chip Rockwell | chip@tomorrow-industries.test | employee | Marketing |

**Tickets** (look up user and department IDs by email/name, don't hardcode numbers):

| Title | Description | Priority | Status | Submitted by | Assigned to | Department |
|---|---|---|---|---|---|---|
| Robo-butler keeps vacuuming the ceiling | Started after last night's update. It's very thorough, but the ceiling is clean and the floor is not. | medium | in_progress | Penny | Rex | HR |
| Video phone only shows static | Calls connect but the screen is all snow. I can hear the caller fine. | high | open | Marge | Rex | Finance |
| Punch card reader is eating my punch cards | Third card this week. It makes a crunching noise and the card never comes back out. | low | open | Marge | (none) | Finance |
| Locked out of the Mainframe after password change | Changed my password this morning and now it says "ACCESS DENIED" in very large letters. | critical | open | Chip | Dot | Marketing |
| Need the new Calc-U-Tron installed | Budget season is coming and I need the Calc-U-Tron 5000 on my workstation. | low | resolved | Penny | Gus | HR |

Also seed a matching `ticket_assignments` row for each assigned ticket, a few `ticket_notes` in the same playful tone (for example, Rex on the robo-butler: "Rolled back the update. Robo-butler now vacuums the floor. Ceiling looks great though."), and a few `activity_logs`.

**Demo logins** shown on the login page:
- Demo employee: penny@tomorrow-industries.test
- Demo IT tech: rex@tomorrow-industries.test

---

## API routes

All routes live under `app/api/`. Every route:
1. Checks the session (except login).
2. Checks the role and ownership rules from the permissions table.
3. Validates input with Zod.
4. Uses parameterized queries only (`$1, $2`), never string-building SQL.
5. Returns the right status code: 200, 201, 400, 401, 403, 404, 429, 500.

| Method | Route | Who | Does |
|---|---|---|---|
| POST | `/api/auth/login` | Anyone | Checks email + password, sets session cookie. Rate-limited |
| POST | `/api/auth/logout` | Logged in | Clears session cookie |
| GET | `/api/auth/me` | Logged in | Returns the current user (no password hash) |
| GET | `/api/departments` | Logged in | List departments |
| GET | `/api/tickets` | Logged in | Employee: own tickets. IT: all. Optional `?status=` filter. Includes joined names |
| POST | `/api/tickets` | Logged in | Create a ticket. `submitted_by` comes from the **session**, never the request body. Rate-limited + capped |
| GET | `/api/tickets/[id]` | Owner or IT | One ticket with joined names + notes |
| PATCH | `/api/tickets/[id]` | IT | Update status and/or priority |
| DELETE | `/api/tickets/[id]` | IT | Delete ticket (notes and assignments cascade) |
| POST | `/api/tickets/[id]/assign` | IT | Assign a tech. Updates `tickets.assigned_to` **and** inserts a `ticket_assignments` row in one transaction |
| GET | `/api/tickets/[id]/notes` | Owner or IT | List notes |
| POST | `/api/tickets/[id]/notes` | Owner or IT | Add a note. Rate-limited + capped |
| GET | `/api/activity-logs` | IT | Latest 100 logs, newest first |
| GET | `/api/cron/reset` | Vercel Cron only | Wipes and reseeds demo data. Requires `CRON_SECRET` |

Every create, assign, status change, and delete writes a row to `activity_logs`. If the log insert fails, log the error to the console but **don't fail the request** (same idea as the class version).

Note: an employee asking for someone else's ticket gets **404, not 403**, so the API doesn't reveal which ticket IDs exist.

---

## Pages

| Page | Who | Shows |
|---|---|---|
| `/login` | Anyone | Email/password form + "Log in as demo employee" and "Log in as demo IT tech" buttons |
| `/tickets` | Logged in | Ticket list with status/priority badges and a status filter |
| `/tickets/new` | Logged in | New ticket form with character counters |
| `/tickets/[id]` | Owner or IT | Ticket details, notes, add-note form. IT also sees assign / status / delete controls |
| `/admin/logs` | IT | Activity log table |

Logged-out visitors are redirected to `/login`. Employees who visit `/admin/logs` are redirected to `/tickets`.

---

## Security and hardening checklist

- [ ] Passwords hashed with bcrypt (cost 12). Plain-text passwords never stored or logged
- [ ] `password_hash` never returned from any route
- [ ] Session = signed JWT (`jose`, HS256) in a cookie that is `httpOnly`, `secure` in production, `sameSite: 'lax'`, expires after 8 hours
- [ ] `SESSION_SECRET` is at least 32 random characters, stored only in env vars
- [ ] Every API route checks session + role + ownership on the server
- [ ] All input validated with Zod (types, required fields, max lengths, allowed values)
- [ ] All SQL uses parameters. No user input is ever concatenated into SQL
- [ ] Login errors are generic: "Invalid email or password" (never reveal which part was wrong)
- [ ] 500 errors return a generic message; details go to the server console only
- [ ] No public sign-up page (demo accounts only), so strangers can't create users
- [ ] Security headers in `next.config` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`)
- [ ] `.env.local` is in `.gitignore`; secrets live in Vercel's Environment Variables settings
- [ ] Cron route rejects any request without `Authorization: Bearer <CRON_SECRET>`

## Spam and usage limits

These protect the Neon free plan (100 compute hours, 1 GB storage a month).

**Rate limits** (stored in the `rate_limits` table, fixed 1-minute windows; return **429** when exceeded):

| Action | Limit | Key |
|---|---|---|
| Login attempts | 5 per minute | per IP address |
| Create ticket | 5 per minute | per user |
| Add note | 10 per minute | per user |
| Any other write | 30 per minute | per user |

Clean up old `rate_limits` rows (older than 1 hour) during the nightly reset.

**Hard caps** (return **429** with a clear message):

| Cap | Limit |
|---|---|
| Open tickets per employee | 10 (statuses `open` + `in_progress`) |
| Notes per ticket | 20 |
| Total tickets in the database | 300 |
| Total notes in the database | 1,000 |

**Nightly reset:** a Vercel Cron job calls `/api/cron/reset` once a day, which re-runs the seed. Anything a visitor adds disappears overnight, so spam can never pile up. Show a small banner in the app: "Demo data resets every night."

---

## Environment variables

`.env.local` (never committed) and Vercel → Settings → Environment Variables:

```
DATABASE_URL=        # Neon pooled connection string
SESSION_SECRET=      # 32+ random characters
DEMO_PASSWORD=       # password used for all seeded demo accounts
CRON_SECRET=         # random string, Vercel sends it to the cron route
```

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/reset", "schedule": "0 8 * * *" }]
}
```

(08:00 UTC = 3–4 a.m. Eastern. The free Vercel plan allows once-a-day cron jobs.)

---

## Phases

### Phase 1 — Foundation and first deploy
- The Next.js app is already created with `create-next-app` (TypeScript, App Router, Tailwind, ESLint)
- Set up the theme basics: color tokens, fonts, and a simple themed home page that says "Ohm Sweet Ohm IT Support"
- Create the Neon project; run `db/schema.sql` in the Neon SQL Editor
- Add `lib/db.ts` (Neon connection) and `scripts/seed.ts`; run the seed
- Add `GET /api/departments` as a first test route
- Push to GitHub, import into Vercel, add env vars, deploy

**Done when:** the live Vercel URL `/api/departments` returns IT, HR, Finance, Marketing.

### Phase 2 — Login and sessions
- `lib/auth.ts`: hash/verify passwords, create/read the session cookie, `requireUser()` and `requireRole('it_staff')` helpers
- Login, logout, and `me` routes
- `/login` page with demo-login buttons
-Demo role toggle: add a “Viewing as: Employee | IT Tech” switch in the header, shown only when logged in as a demo account (Penny or Rex). It calls POST /api/auth/demo-switch, which verifies the current session is a demo account, then issues a new session cookie for the other demo account. Never switch roles on the client. Rate-limit it like other writes. After switching, refresh the current page; if that page isn’t allowed for the new role (like /admin/logs for Penny), redirect to /tickets.
-Demo login buttons call POST /api/auth/demo-login with { role }, which signs in as the matching demo account (Penny or Rex) on the server. The demo password is never sent to or stored in the browser. Rate-limit it like the login route.
- Redirect logged-out visitors to `/login`

**Done when:** -You can log in with the email and password form as any user, refresh the page and stay logged in, and log out.
-A wrong password shows “Invalid email or password.”
-On the login page, “Log in as demo employee” logs in as Penny and “Log in as demo IT tech” logs in as Rex, without typing anything.
-The demo password does not appear anywhere in the browser (check the page source and the Network tab in DevTools).
-While logged in as Penny or Rex, the “Viewing as: Employee | IT Tech” toggle appears in the header, and one click swaps to the other account.
-The toggle does not appear when logged in as a non-demo user, like Dot.
Calling POST /api/auth/demo-switch in Thunder Client without being logged in as a demo account returns 401 or 403.
-Switching to Penny while on an IT-only page redirects to /tickets. This one can only be fully tested after Phase 4 builds /admin/logs.

### Phase 3 — Tickets (core)
- `GET /api/tickets`, `POST /api/tickets`, `GET /api/tickets/[id]`
- `/tickets`, `/tickets/new`, `/tickets/[id]` pages
- Employees see only their own tickets

**Done when:** logged in as Penny, you see only Penny's 2 tickets and can create a new one. Visiting Marge's ticket by URL returns "not found." Logged in as Rex, you see every ticket.

### Phase 4 — IT staff features and notes
- Assign tech, change status/priority, delete ticket
- Notes: list and add
- Activity logging on every write
- `/admin/logs` page

**Done when:** Rex can assign Gus to the punch card ticket, mark a ticket resolved, delete one, and see each action in the activity log. Penny gets 404/403 if she calls those routes directly (test in Thunder Client).

### Phase 5 — Hardening and limits
- Zod validation on every route
- Rate limits, caps, and 429 responses
- Security headers
- Cron reset route + `vercel.json` + demo banner

**Done when:** a 6th login attempt within a minute gets 429; an 11th open ticket for Penny is rejected; oversized input gets 400; the cron route returns 401 without the secret.

### Phase 6 — Polish and portfolio
- Full theme pass: starburst priority badges, appliance-style cards, amber terminal log page, playful empty and loading states, mobile layout
- Optional: the original robot mascot on the login page and empty states
- README with screenshots, the ER diagram, the stack, and the demo logins
- Add to the portfolio site after Barbershop 2.0

**Done when:** a stranger can open the link, click "Log in as demo employee," file a ticket, then log in as the demo tech and resolve it, without any instructions.
