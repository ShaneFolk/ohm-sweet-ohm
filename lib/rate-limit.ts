import "server-only";
import { query } from "./db";

// Fixed 1-minute windows stored in the rate_limits table (see PLAN.md).
// Each request adds 1 to the counter for its key in the current minute.
// Over the limit = 429 until the next minute starts.

const LIMITS = {
  login: 5, // per IP
  "demo-login": 5, // per IP
  ticket: 5, // per user
  note: 10, // per user
  write: 30, // per user: status/priority, delete, assign, demo switch
} as const;

export type LimitName = keyof typeof LIMITS;

/**
 * Count this request. Returns a 429 Response if the limit is used up, or null
 * if the request may go ahead. `who` is a user ID or an IP address.
 *
 *   const limited = await rateLimit("ticket", user.id);
 *   if (limited) return limited;
 */
export async function rateLimit(name: LimitName, who: string | number): Promise<Response | null> {
  const key = `${name}:${who}`;
  try {
    // One atomic statement: create the row for this minute, or add 1 to it.
    // Two requests at the same moment can't both read the old count.
    const [row] = await query<{ count: number }>(
      `INSERT INTO rate_limits (key, window_start, count)
       VALUES ($1, date_trunc('minute', now()), 1)
       ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
       RETURNING count`,
      [key]
    );
    if (row.count <= LIMITS[name]) return null;
  } catch (err) {
    // If the counter itself breaks, let the request through rather than lock
    // everyone out. The error still shows in the server logs.
    console.error(`rateLimit(${key}) failed:`, err);
    return null;
  }

  const secondsLeft = 60 - new Date().getSeconds();
  return Response.json(
    { error: "Too many requests. Please wait a minute and try again." },
    { status: 429, headers: { "Retry-After": String(secondsLeft) } }
  );
}

/**
 * The visitor's IP address. On Vercel, x-forwarded-for is set by Vercel itself
 * (the first entry is the real client). Locally there may be none.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
