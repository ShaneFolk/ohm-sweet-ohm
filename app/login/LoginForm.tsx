"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Pending = null | "form" | "employee" | "it_staff";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending>(null);

  // Next.js keeps this page alive (hidden) after we navigate away, state and all.
  // After a successful login, wipe the form when it gets hidden, so the password
  // isn't kept around and the buttons aren't stuck on "Connecting…" next time.
  const loggedIn = useRef(false);
  useLayoutEffect(() => {
    return () => {
      if (loggedIn.current) {
        loggedIn.current = false;
        setEmail("");
        setPassword("");
        setError("");
        setPending(null);
      }
    };
  }, []);

  // Shared by the form and the demo buttons: POST, then go home on success.
  async function send(url: string, body: object, which: Pending) {
    setPending(which);
    setError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(res.status === 500 || !data.error ? "Something went wrong. Please try again." : data.error);
        setPending(null);
        return;
      }
      // refresh() re-renders the server parts (like the header) with the new cookie.
      // TODO (Phase 3): send people to /tickets once it exists.
      loggedIn.current = true;
      router.replace("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setPending(null);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send("/api/auth/login", { email, password }, "form");
  }

  const busy = pending !== null;
  const input =
    "mt-1 w-full rounded-xl border-2 border-chrome bg-white px-3 py-2 text-charcoal " +
    "focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30";

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block">
          <span className="text-sm font-bold">Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
        </label>

        {/* role="alert" makes screen readers announce the error when it appears */}
        <p role="alert" className="min-h-6 text-sm font-bold text-critical">
          {error}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-teal px-5 py-3 font-display text-lg text-white shadow-[0_4px_0_var(--color-teal-dark)] transition hover:bg-teal-dark active:translate-y-0.5 active:shadow-none disabled:opacity-60"
        >
          {pending === "form" ? "Warming up the tubes…" : "Log in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-orange">
        <span className="h-0.5 flex-1 bg-chrome" />
        or take a demo for a spin
        <span className="h-0.5 flex-1 bg-chrome" />
      </div>

      <div className="grid gap-3">
        <DemoButton
          label="Log in as demo employee"
          who="Penny Circuit, HR"
          email="penny@tomorrow-industries.test"
          loading={pending === "employee"}
          disabled={busy}
          onClick={() => send("/api/auth/demo-login", { role: "employee" }, "employee")}
        />
        <DemoButton
          label="Log in as demo IT tech"
          who="Rex Voltage, IT"
          email="rex@tomorrow-industries.test"
          loading={pending === "it_staff"}
          disabled={busy}
          onClick={() => send("/api/auth/demo-login", { role: "it_staff" }, "it_staff")}
        />
      </div>
    </div>
  );
}

function DemoButton(props: {
  label: string;
  who: string;
  email: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="rounded-2xl border-2 border-orange bg-cream px-4 py-3 text-left transition hover:bg-orange/10 disabled:opacity-60"
    >
      <span className="block font-bold text-orange">{props.loading ? "Connecting…" : props.label}</span>
      <span className="block text-sm">{props.who}</span>
      {/* break-words only splits the email if it truly can't fit (tiny phones) */}
      <span className="block break-words text-xs text-charcoal/70">{props.email}</span>
    </button>
  );
}
