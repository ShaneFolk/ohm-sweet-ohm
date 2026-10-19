import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listTickets, STATUSES, type Status } from "@/lib/tickets";
import { PriorityBadge, STATUS_LABELS, StatusBadge } from "../components/Badges";

export const metadata: Metadata = { title: "Tickets | Ohm Sweet Ohm IT Support" };

// The heading area is static and loads instantly. Everything that depends on
// who's logged in (or the ?status filter) streams in inside <Suspense>.
export default function TicketsPage({ searchParams }: PageProps<"/tickets">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-teal sm:text-4xl">Ticket Desk</h1>
        <Link
          href="/tickets/new"
          className="rounded-full bg-orange px-5 py-2 font-display text-white shadow-[0_4px_0_var(--color-orange-dark)] transition hover:brightness-95 active:translate-y-0.5 active:shadow-none"
        >
          + New ticket
        </Link>
      </div>
      <Suspense fallback={<LoadingCard />}>
        <TicketList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TicketList({ searchParams }: { searchParams: PageProps<"/tickets">["searchParams"] }) {
  // proxy.ts already sends logged-out visitors to /login; this is the real check.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const query = await searchParams;
  // Anything that isn't a known status (or missing) means "all".
  const status = STATUSES.find((s) => s === query.status) as Status | undefined;
  // Set by /tickets/[id] when the ticket doesn't exist or isn't yours,
  // and by the delete button after a successful delete.
  const notFound = query.notice === "not-found";
  const deleted = query.notice === "deleted";

  const tickets = await listTickets(user, status);
  const isIT = user.role === "it_staff";

  return (
    <>
      {notFound && (
        <p role="alert" className="mb-4 rounded-2xl border-2 border-orange bg-orange/10 p-4 font-bold text-orange-dark">
          Ticket not found. It may have been deleted, or it belongs to someone else.
        </p>
      )}
      {deleted && (
        <p role="status" className="mb-4 rounded-2xl border-2 border-chrome bg-white/80 p-4 font-bold">
          Ticket deleted. It&apos;s gone to the big scrap heap in the sky.
        </p>
      )}
      <p className="mb-4">
        {isIT
          ? "Every ticket at Tomorrow Industries, newest first."
          : "Your tickets, newest first. A technician will be along shortly!"}
      </p>

      <StatusFilter current={status} />

      {tickets.length === 0 ? (
        <EmptyCard filtered={!!status} />
      ) : (
        <ul className="grid gap-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tickets/${t.id}`}
                className="block rounded-2xl border-2 border-chrome bg-white/80 p-4 shadow-[0_3px_0_var(--color-chrome)] transition hover:border-teal"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-bold">
                    <span className="text-charcoal/60">#{t.id}</span> {t.title}
                  </h2>
                  <div className="flex shrink-0 gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-charcoal/80">
                  {isIT && <>From {t.submitted_by_name} ({t.department_name}) · </>}
                  {t.assigned_to_name ? `Tech: ${t.assigned_to_name}` : "Not assigned yet"} ·{" "}
                  {formatDate(t.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Plain links (?status=...), so the filter works without any client JavaScript
// and the URL can be bookmarked or shared.
function StatusFilter({ current }: { current?: Status }) {
  const options: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: "/tickets", active: !current },
    ...STATUSES.map((s) => ({ label: STATUS_LABELS[s], href: `/tickets?status=${s}`, active: current === s })),
  ];
  return (
    <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.label}
          href={o.href}
          aria-current={o.active ? "page" : undefined}
          className={
            "rounded-full border-2 px-4 py-1 text-sm font-bold transition " +
            (o.active ? "border-teal bg-teal text-white" : "border-chrome bg-white text-charcoal hover:border-teal")
          }
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

function EmptyCard({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-chrome bg-white/60 p-8 text-center">
      <p className="font-display text-xl text-teal">All quiet on the appliance front!</p>
      <p className="mt-2">
        {filtered ? "No tickets with that status." : "No tickets yet. Everything's humming along nicely."}
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <p className="rounded-2xl border-2 border-chrome bg-white/60 p-8 text-center font-bold text-teal">
      Fetching tickets from the mainframe…
    </p>
  );
}
