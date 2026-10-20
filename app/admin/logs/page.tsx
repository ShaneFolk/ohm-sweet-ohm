import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listActivity, LOG_FILTERS, type ActivityEntry, type LogFilter } from "@/lib/activity";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Activity log | Ohm Sweet Ohm IT Support" };

// The amber "terminal" from the theme: monospace amber text on dark brown.
export default function ActivityLogPage({ searchParams }: PageProps<"/admin/logs">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="font-display text-3xl text-teal sm:text-4xl">Activity Log</h1>
      <p className="mb-5 mt-2">Every change and sign-in at the help desk, newest first (latest 100).</p>

      <div className="overflow-hidden rounded-3xl border-4 border-chrome bg-terminal shadow-[0_6px_0_var(--color-chrome)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber/30 px-4 py-2 font-mono text-xs text-amber/80">
          <span>TOMORROW INDUSTRIES · MAINFRAME LOG</span>
          {/* Decorative control-panel lamps, like an old mainframe. */}
          <div aria-hidden="true" className="flex gap-4">
            <Lamp label="Power" color="var(--color-orange)" />
            <Lamp label="Tape" color="var(--color-mustard)" />
            <Lamp label="Ready" color="var(--color-teal)" pulse />
          </div>
        </div>
        <Suspense fallback={<p className="p-5 font-mono text-amber">LOADING TAPE REEL…</p>}>
          <LogLines searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

// A small glowing bulb with a label under it. `pulse` makes it glow softly
// (skipped for people who've asked their computer to reduce motion).
function Lamp({ label, color, pulse }: { label: string; color: string; pulse?: boolean }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span
        className={`h-3 w-3 rounded-full border border-black/30 ${pulse ? "motion-safe:animate-pulse" : ""}`}
        style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}` }}
      />
      <span className="text-[0.6rem] uppercase tracking-widest text-amber/70">{label}</span>
    </span>
  );
}

async function LogLines({ searchParams }: { searchParams: PageProps<"/admin/logs">["searchParams"] }) {
  // proxy.ts already redirects employees; this is the real check.
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "it_staff") redirect("/tickets");

  // Anything that isn't a known filter (or missing) means "all".
  const query = await searchParams;
  const filter = LOG_FILTERS.find((f) => f === query.filter) ?? "all";
  const logs = await listActivity(user, filter);

  return (
    <>
      <LogFilter current={filter} />
      {logs.length === 0 ? (
        <p className="p-5 font-mono text-amber">&gt; NO ACTIVITY ON THIS CHANNEL. ALL SYSTEMS NOMINAL.</p>
      ) : (
        <LogList logs={logs} />
      )}
    </>
  );
}

const FILTER_LABELS: Record<LogFilter, string> = { all: "All", tickets: "Tickets", logins: "Logins" };

// Plain links (?filter=...), like the ticket status filter: no client
// JavaScript needed, and the URL can be bookmarked.
function LogFilter({ current }: { current: LogFilter }) {
  return (
    <nav aria-label="Filter the log" className="flex flex-wrap gap-2 border-b border-amber/20 px-4 py-3 font-mono text-xs">
      {LOG_FILTERS.map((f) => (
        <Link
          key={f}
          href={f === "all" ? "/admin/logs" : `/admin/logs?filter=${f}`}
          aria-current={f === current ? "page" : undefined}
          className={
            "rounded border px-3 py-1 uppercase tracking-widest transition " +
            (f === current
              ? "border-amber bg-amber text-terminal"
              : "border-amber/40 text-amber hover:border-amber")
          }
        >
          {FILTER_LABELS[f]}
        </Link>
      ))}
    </nav>
  );
}

function LogList({ logs }: { logs: ActivityEntry[] }) {
  return (
    <ol className="max-h-[70vh] overflow-y-auto p-4 font-mono text-sm leading-relaxed text-amber sm:p-5">
      {logs.map((l) => (
        // Each entry wraps on narrow screens instead of scrolling sideways.
        <li key={l.id} className="border-b border-amber/10 py-2 last:border-0">
          <span className="text-amber/60">[{formatDate(l.created_at)}]</span>{" "}
          <span className="font-semibold uppercase">{l.action.replace(/_/g, " ")}</span>{" "}
          {l.ticket_id && (
            <Link href={`/tickets/${l.ticket_id}`} className="underline decoration-amber/40 hover:decoration-amber">
              #{l.ticket_id}
            </Link>
          )}
          <span className="block break-words text-amber/90 sm:inline sm:before:content-['_—_']">
            {l.details}
            {!l.user_name && l.user_id && <span className="text-amber/60"> (user #{l.user_id}, removed)</span>}
          </span>
        </li>
      ))}
      <li aria-hidden="true" className="pt-2">
        &gt; <span className="motion-safe:animate-pulse">█</span>
      </li>
    </ol>
  );
}
