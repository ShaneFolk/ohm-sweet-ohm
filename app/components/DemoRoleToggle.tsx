"use client";

import { useState } from "react";
import type { Role } from "@/lib/session-token";

// "Viewing as: Employee | IT Tech" switch. Only rendered for Penny and Rex
// (SiteHeader decides), and the server re-checks that on every switch.
export default function DemoRoleToggle({ role }: { role: Role }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function switchTo(target: Role) {
    if (target === role || pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo-switch", { method: "POST" });
      if (res.status === 429) {
        setError("Too many switches. Wait a minute.");
        setPending(false);
        return;
      }
      if (!res.ok) throw new Error();
      // Full reload of the current page as the new user, so nothing from the
      // previous account lingers. Pages the new role can't see redirect on the
      // server (e.g. /admin/* sends employees to /tickets).
      window.location.reload();
    } catch {
      setError("Switch failed");
      setPending(false);
    }
  }

  const option = (target: Role, label: string) => {
    const active = target === role;
    return (
      <button
        type="button"
        aria-pressed={active}
        disabled={pending}
        onClick={() => switchTo(target)}
        className={
          "rounded-full px-3 py-1 font-bold transition disabled:opacity-60 " +
          (active ? "bg-teal text-white" : "text-teal hover:bg-teal/10")
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold text-orange">Viewing as:</span>
      <div role="group" aria-label="Demo role" className="flex rounded-full border-2 border-teal bg-white p-0.5">
        {option("employee", "Employee")}
        {option("it_staff", "IT Tech")}
      </div>
      {error && <span role="alert" className="text-xs font-bold text-critical">{error}</span>}
    </div>
  );
}
