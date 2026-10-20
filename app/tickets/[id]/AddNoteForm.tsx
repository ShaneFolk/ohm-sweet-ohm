"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client-api";
import { NOTE_MAX } from "@/lib/ticket-rules";

export default function AddNoteForm({ ticketId }: { ticketId: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setError("Write something first");
      return;
    }
    setPending(true);
    setError("");
    const result = await apiSend(`/api/tickets/${ticketId}/notes`, "POST", { note });
    setPending(false);
    if (!result.ok) {
      setError(result.fields?.note?.[0] ?? result.error);
      return;
    }
    setNote("");
    router.refresh(); // re-render the server page so the new note shows up
  }

  return (
    <form onSubmit={onSubmit} className="appliance-card mt-4 p-4">
      <label htmlFor="note" className="text-sm font-bold">
        Add a note
      </label>
      <textarea
        id="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={NOTE_MAX}
        rows={3}
        placeholder="Any updates? Strange new noises?"
        className="mt-1 w-full rounded-xl border-2 border-chrome bg-white px-3 py-2 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <div className="mt-1 flex items-center justify-between gap-3">
        <p role="alert" className="text-sm font-bold text-critical">
          {error}
        </p>
        <span className="text-xs text-charcoal/70">
          {note.length} / {NOTE_MAX}
        </span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-teal px-5 py-2 font-display text-white shadow-[0_3px_0_var(--color-teal-dark)] transition hover:bg-teal-dark active:translate-y-0.5 active:shadow-none disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post note"}
      </button>
    </form>
  );
}
