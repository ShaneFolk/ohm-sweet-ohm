"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    // Even if this fails (say, the session already expired), go to /login.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // A full page load, not router.push: Next.js keeps visited pages alive in the
    // background with their state, and one user's leftovers (typed text, stuck
    // buttons) must never carry over to the next person who logs in.
    // Next.js's "Preserving UI state" guide recommends exactly this for logout.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="rounded-full border-2 border-teal px-3 py-1 font-bold text-teal transition hover:bg-teal hover:text-white disabled:opacity-60"
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
