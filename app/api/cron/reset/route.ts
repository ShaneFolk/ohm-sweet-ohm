import { createHash, timingSafeEqual } from "node:crypto";
import { seedDatabase } from "@/lib/seed";

// GET /api/cron/reset: wipes and reseeds the demo data.
// Vercel Cron calls this every night (see vercel.json) and automatically sends
// "Authorization: Bearer <CRON_SECRET>". Anyone without the secret gets 401.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("GET /api/cron/reset: CRON_SECRET is not set");
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }

  if (!matches(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const counts = await seedDatabase();
    console.log("Nightly reset done:", counts);
    return Response.json({ ok: true, ...counts });
  } catch (err) {
    console.error("GET /api/cron/reset failed:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * Compare two strings in constant time, so an attacker can't guess the secret
 * one character at a time by measuring how fast wrong answers fail.
 * Hashing first makes both sides the same length, which timingSafeEqual needs.
 */
function matches(given: string, expected: string) {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
