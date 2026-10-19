"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client-api";
import { PRIORITIES, STATUSES, type Priority, type Status } from "@/lib/ticket-rules";
import { STATUS_LABELS } from "../../components/Badges";

type Props = {
  ticketId: number;
  status: Status;
  priority: Priority;
  assignedTo: number | null;
  techs: { id: number; name: string }[];
};

// IT staff only (the page decides; the API checks again on every request).
export default function TechControls(props: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(props.status);
  const [priority, setPriority] = useState(props.priority);
  const [tech, setTech] = useState(props.assignedTo ? String(props.assignedTo) : "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const changed = status !== props.status || priority !== props.priority;
  const techChanged = tech !== "" && Number(tech) !== props.assignedTo;

  async function run(url: string, method: string, body?: unknown, after?: () => void) {
    setBusy(true);
    setError("");
    const result = await apiSend(url, method, body);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    if (after) after();
    else {
      setBusy(false);
      router.refresh(); // re-render the page with the saved values
    }
  }

  function saveChanges() {
    // Only send what actually changed.
    const body: { status?: Status; priority?: Priority } = {};
    if (status !== props.status) body.status = status;
    if (priority !== props.priority) body.priority = priority;
    run(`/api/tickets/${props.ticketId}`, "PATCH", body);
  }

  function assign() {
    run(`/api/tickets/${props.ticketId}/assign`, "POST", { assigned_to: Number(tech) });
  }

  function deleteTicket() {
    run(`/api/tickets/${props.ticketId}`, "DELETE", undefined, () => {
      router.push("/tickets?notice=deleted");
      router.refresh();
    });
  }

  const select =
    "mt-1 w-full rounded-xl border-2 border-chrome bg-white px-3 py-2 focus:border-teal focus:outline-none";
  const button =
    "rounded-full px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section
      aria-labelledby="tech-controls"
      className="mt-6 rounded-3xl border-4 border-mustard/60 bg-mustard/10 p-5 sm:p-6"
    >
      <h2 id="tech-controls" className="font-display text-xl text-charcoal">
        Technician controls
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={select}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold">
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={select}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={saveChanges}
        disabled={!changed || busy}
        className={`${button} mt-3 bg-teal text-white hover:bg-teal-dark`}
      >
        Save changes
      </button>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block min-w-48 flex-1 text-sm font-bold">
          Technician
          <select value={tech} onChange={(e) => setTech(e.target.value)} className={select}>
            {!props.assignedTo && <option value="">Choose a tech…</option>}
            {props.techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={assign}
          disabled={!techChanged || busy}
          className={`${button} bg-teal text-white hover:bg-teal-dark`}
        >
          Assign
        </button>
      </div>

      <div className="mt-6 border-t-2 border-mustard/40 pt-4">
        {/* Two-step delete instead of a browser pop-up: click, then confirm. */}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className={`${button} border-2 border-critical text-critical hover:bg-critical hover:text-white`}
          >
            Delete ticket
          </button>
        ) : (
          <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-critical">Delete this ticket and its notes for good?</span>
            <button
              type="button"
              onClick={deleteTicket}
              disabled={busy}
              className={`${button} bg-critical text-white hover:brightness-90`}
            >
              {busy ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className={`${button} border-2 border-chrome bg-white`}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <p role="alert" className="mt-3 min-h-6 text-sm font-bold text-critical">
        {error}
      </p>
    </section>
  );
}
