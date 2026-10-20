import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getTicket, TicketIdSchema } from "@/lib/tickets";
import { listTechs } from "@/lib/users";
import { EmptyCard, LoadingCard } from "../../components/Atom";
import { PriorityBadge, StatusBadge } from "../../components/Badges";
import AddNoteForm from "./AddNoteForm";
import TechControls from "./TechControls";

export const metadata: Metadata = { title: "Ticket | Ohm Sweet Ohm IT Support" };

// The back link is static; the ticket itself depends on who's logged in,
// so it streams in inside <Suspense>.
export default function TicketPage({ params, searchParams }: PageProps<"/tickets/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/tickets" className="text-sm font-bold text-teal hover:underline">
        ← Back to the Ticket Desk
      </Link>
      <Suspense fallback={<LoadingCard message="Pulling the file from the cabinet…" className="mt-4" />}>
        <TicketDetails params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TicketDetails({ params, searchParams }: PageProps<"/tickets/[id]">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Missing, malformed, or someone else's ticket: all treated the same, so the
  // page never reveals which ticket IDs exist. The list shows "Ticket not found".
  const id = TicketIdSchema.safeParse((await params).id);
  const ticket = id.success ? await getTicket(user, id.data) : null;
  if (!ticket) redirect("/tickets?notice=not-found");

  const justCreated = (await searchParams).created === "1";
  const isIT = user.role === "it_staff";
  const techs = isIT ? await listTechs() : [];

  return (
    <>
      {justCreated && (
        <p role="status" className="mt-4 rounded-2xl border-2 border-status-resolved bg-status-resolved/10 p-4 font-bold text-status-resolved">
          Your ticket is in good hands! A technician will be along shortly.
        </p>
      )}

      <article className="mt-4 appliance-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl text-teal sm:text-3xl">
            <span className="text-charcoal/60">#{ticket.id}</span> {ticket.title}
          </h1>
          <div className="flex gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Detail label="Submitted by" value={`${ticket.submitted_by_name} (${ticket.department_name ?? "No department"})`} />
          <Detail label="Technician" value={ticket.assigned_to_name ?? "Not assigned yet"} />
          <Detail label="Filed" value={formatDate(ticket.created_at)} />
          <Detail label="Last updated" value={formatDate(ticket.updated_at)} />
        </dl>

        <h2 className="mt-6 text-sm font-bold uppercase tracking-widest text-orange">The trouble</h2>
        {/* whitespace-pre-wrap keeps the line breaks people typed */}
        <p className="mt-2 whitespace-pre-wrap break-words">
          {ticket.description ?? <span className="italic text-charcoal/70">No details given.</span>}
        </p>
      </article>

      {isIT && (
        <TechControls
          // A new key after every save (updated_at changes) resets the dropdowns
          // to the freshly saved values.
          key={ticket.updated_at.toISOString()}
          ticketId={ticket.id}
          status={ticket.status}
          priority={ticket.priority}
          assignedTo={ticket.assigned_to}
          techs={techs}
        />
      )}

      <section className="mt-6">
        <h2 className="font-display text-xl text-teal">Notes</h2>
        {ticket.notes.length === 0 ? (
          <EmptyCard title="No notes yet" className="mt-2 p-5!">
            <p>The technicians are warming up their slide rules.</p>
          </EmptyCard>
        ) : (
          <ol className="mt-3 grid gap-3">
            {ticket.notes.map((n) => (
              <li key={n.id} className="appliance-card p-4">
                <p className="whitespace-pre-wrap break-words">{n.note}</p>
                <p className="mt-2 text-xs text-charcoal/70">
                  {n.user_name} · {formatDate(n.created_at)}
                </p>
              </li>
            ))}
          </ol>
        )}
        {/* Anyone who got this far can see the ticket, so they may add notes. */}
        <AddNoteForm ticketId={ticket.id} />
      </section>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-bold text-charcoal/70">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
