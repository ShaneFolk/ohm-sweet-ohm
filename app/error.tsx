"use client"; // Next.js requires error pages to be client components

import { useEffect } from "react";
import Atom from "./components/Atom";

// Shown when a page crashes on the server or in the browser. The real error
// is never displayed (it could leak details); it goes to the console, and
// errors from the server only carry a short ID (digest) to match the server logs.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div role="alert" className="appliance-panel w-full max-w-lg p-8 text-center sm:p-10">
        <Atom className="mx-auto h-14 w-14 text-critical" />
        <h1 className="mt-4 font-display text-3xl text-teal">Whoops, we blew a fuse!</h1>
        <p className="mt-3">
          Something went wrong on our end. A technician has been dispatched with a fresh fuse.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 rounded-full bg-teal px-6 py-2 font-display text-white shadow-[0_4px_0_var(--color-teal-dark)] transition hover:bg-teal-dark active:translate-y-0.5 active:shadow-none"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
