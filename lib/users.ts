import "server-only";
import { query } from "./db";
import type { Role, SessionUser } from "./auth";

type UserRow = {
  id: number;
  email: string;
  first_name: string;
  role: Role;
  password_hash: string;
};

/**
 * Look a user up by email for logging in. This is the only query that reads
 * password_hash, and the hash never leaves the server: callers turn the row
 * into a SessionUser with toSessionUser().
 */
export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    "SELECT id, email, first_name, role, password_hash FROM users WHERE email = $1",
    [email]
  );
  return rows[0] ?? null;
}

export function toSessionUser(row: UserRow): SessionUser {
  return { id: row.id, email: row.email, firstName: row.first_name, role: row.role };
}
