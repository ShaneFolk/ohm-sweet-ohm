"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  DESCRIPTION_MAX,
  NewTicketSchema,
  PRIORITIES,
  TITLE_MAX,
  type Priority,
} from "@/lib/ticket-rules";

type FieldErrors = Partial<Record<"title" | "description" | "priority", string[]>>;

// Highlight color for the selected priority (border, tint, and radio dot).
const PRIORITY_SELECTED: Record<Priority, string> = {
  low: "border-status-resolved bg-status-resolved/10 accent-status-resolved",
  medium: "border-mustard bg-mustard/15 accent-mustard",
  high: "border-orange bg-orange/10 accent-orange",
  critical: "border-critical bg-critical/10 accent-critical",
};

const PRIORITY_HINTS: Record<Priority, string> = {
  low: "Whenever you get a chance",
  medium: "It's slowing me down",
  high: "I can barely work",
  critical: "Everything is on fire!",
};

export default function NewTicketForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Same rules the server uses, so most mistakes are caught before sending.
    const parsed = NewTicketSchema.safeParse({ title, description, priority });
    if (!parsed.success) {
      setFields(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFields({});
    setPending(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setFields(data.fields);
        // 401 = session expired; 429 (Phase 5) = rate limit or cap, with its own message.
        setError(res.status === 500 || !data.error ? "Something went wrong. Please try again." : data.error);
        setPending(false);
        return;
      }

      // Next.js keeps this page alive in the background, so clear it before
      // leaving; otherwise the old ticket would still be filled in next time.
      setTitle("");
      setDescription("");
      setPriority("medium");
      setPending(false);
      // ?created=1 shows the "Your ticket is in good hands!" banner.
      router.push(`/tickets/${data.ticket.id}?created=1`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border-2 border-chrome bg-white px-3 py-2 text-charcoal " +
    "focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="title" className="text-sm font-bold">
          What&apos;s on the fritz?
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="e.g. Robo-butler keeps vacuuming the ceiling"
          aria-invalid={!!fields.title}
          aria-describedby="title-help"
          className={input}
        />
        <FieldFooter id="title-help" errors={fields.title} length={title.length} max={TITLE_MAX} />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-bold">
          Tell us more <span className="font-normal text-charcoal/70">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={6}
          placeholder="When did it start? What were you doing? Any strange noises?"
          aria-invalid={!!fields.description}
          aria-describedby="description-help"
          className={input}
        />
        <FieldFooter
          id="description-help"
          errors={fields.description}
          length={description.length}
          max={DESCRIPTION_MAX}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-bold">How urgent is it?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className={
                "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 transition " +
                (priority === p ? PRIORITY_SELECTED[p] : "border-chrome bg-white hover:border-teal")
              }
            >
              <input
                type="radio"
                name="priority"
                value={p}
                checked={priority === p}
                onChange={() => setPriority(p)}
              />
              <span>
                <span className="block font-bold capitalize">{p}</span>
                <span className="block text-xs text-charcoal/70">{PRIORITY_HINTS[p]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p role="alert" className="min-h-6 text-sm font-bold text-critical">
        {error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-teal px-5 py-3 font-display text-lg text-white shadow-[0_4px_0_var(--color-teal-dark)] transition hover:bg-teal-dark active:translate-y-0.5 active:shadow-none disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Sending it down the pneumatic tube…" : "Submit ticket"}
      </button>
    </form>
  );
}

// Error message (if any) on the left, "42 / 120" counter on the right.
function FieldFooter(props: { id: string; errors?: string[]; length: number; max: number }) {
  const near = props.length >= props.max * 0.9;
  return (
    <div id={props.id} className="mt-1 flex justify-between gap-3 text-xs">
      <span className="font-bold text-critical">{props.errors?.[0]}</span>
      <span className={near ? "font-bold text-orange" : "text-charcoal/60"} aria-live="polite">
        {props.length} / {props.max}
      </span>
    </div>
  );
}
