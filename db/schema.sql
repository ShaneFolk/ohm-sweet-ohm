-- Ohm Sweet Ohm IT Support: database schema (PostgreSQL / Neon)
-- Run once in the Neon SQL Editor on a fresh database.

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
  -- Demo accounts only: a one-way hash of the visitor's IP, so the open-ticket
  -- cap is per visitor instead of shared by everyone using Penny. Never returned.
  submitter_ip_hash TEXT,
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
