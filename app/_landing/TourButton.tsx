"use client";

import { useState } from "react";

// One step of the "Take it for a spin" tour: logs in as a demo account
// (POST /api/auth/demo-login, the same route the login page uses), then opens
// the page that step is about. The server picks the account; the browser only
// sends the role.
export default function TourButton({
  role,
  to,
  label,
}: {
  role: "employee" | "it_staff";
  to: string;
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(res.status === 429 && data.error ? data.error : "Something went wrong. Please try again.");
        setPending(false);
        return;
      }
      // A full page load, like logout and the role toggle, so nothing from a
      // previous account lingers in pages Next.js kept alive.
      window.location.href = to;
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="rounded-full bg-orange px-5 py-2 font-display text-white shadow-[0_4px_0_var(--color-orange-dark)] transition hover:brightness-95 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
      >
        {pending ? "Warming up the tubes…" : label}
      </button>
      <p role="alert" className="mt-2 min-h-5 text-sm font-bold text-critical">
        {error}
      </p>
    </div>
  );
}
