import type { Metadata } from "next";
import Link from "next/link";
import NewTicketForm from "./NewTicketForm";

export const metadata: Metadata = { title: "New ticket | Ohm Sweet Ohm IT Support" };

// Static page. proxy.ts keeps logged-out visitors away, and POST /api/tickets
// checks the session itself, so the page doesn't need to read it.
export default function NewTicketPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/tickets" className="text-sm font-bold text-teal hover:underline">
        ← Back to the Ticket Desk
      </Link>
      <div className="mt-4 rounded-3xl border-4 border-chrome bg-white/70 p-6 shadow-[0_6px_0_var(--color-chrome)] sm:p-10">
        <h1 className="font-display text-3xl text-teal">File a new ticket</h1>
        <p className="mb-6 mt-2">
          Tell us what&apos;s acting up, and a friendly technician will be along shortly!
        </p>
        <NewTicketForm />
      </div>
    </main>
  );
}
