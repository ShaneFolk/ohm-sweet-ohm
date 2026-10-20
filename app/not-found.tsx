import type { Metadata } from "next";
import Link from "next/link";
import Robot from "./components/Robot";

export const metadata: Metadata = { title: "Page not found | Ohm Sweet Ohm IT Support" };

// Shown for any URL that doesn't match a page (Next.js uses this file automatically).
// Static: it doesn't read the session, and proxy.ts already sent logged-out visitors to /login.
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="appliance-panel w-full max-w-lg p-8 text-center sm:p-10">
        {/* the robot, scratching its head over a missing page */}
        <div className="relative mx-auto w-fit">
          <Robot className="h-28 w-auto" />
          <span aria-hidden="true" className="absolute -right-5 -top-1 font-display text-4xl text-orange">
            ?
          </span>
        </div>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-orange">Error 404</p>
        <h1 className="mt-2 font-display text-3xl text-teal">This page has left the building!</h1>
        <p className="mt-3">
          We checked every filing cabinet at Tomorrow Industries, but there&apos;s no page at this address.
        </p>
        <Link
          href="/tickets"
          className="mt-6 inline-block rounded-full bg-teal px-6 py-2 font-display text-white shadow-[0_4px_0_var(--color-teal-dark)] transition hover:bg-teal-dark active:translate-y-0.5 active:shadow-none"
        >
          Back to the Ticket Desk
        </Link>
      </div>
    </main>
  );
}
