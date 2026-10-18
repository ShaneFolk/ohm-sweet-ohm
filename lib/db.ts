import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Neon's HTTP driver: each query is one quick HTTPS request, which suits
// serverless functions on Vercel (no long-lived connections to manage).
let client: NeonQueryFunction<false, false> | null = null;

// Created on first use, not at import time, so `next build` doesn't need the
// database and a missing env var gives a clear error.
function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

/**
 * Run one parameterized query and return the rows.
 * Always pass user input through `params` ($1, $2, ...), never inside `text`.
 *
 *   const rows = await query<{ id: number }>("SELECT id FROM users WHERE email = $1", [email]);
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  return (await getClient().query(text, params)) as T[];
}

export type Query = { text: string; params?: unknown[] };

/**
 * Run several parameterized queries as one all-or-nothing transaction.
 * If any query fails, none of them are saved.
 * The queries are sent together, so a later query can't use an earlier one's
 * result in JavaScript. Look values up inside the SQL instead (a subquery).
 */
export async function transaction(queries: Query[]) {
  const sql = getClient();
  return sql.transaction(queries.map((q) => sql.query(q.text, q.params ?? [])));
}
