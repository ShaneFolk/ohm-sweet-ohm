import type { Priority, Status } from "@/lib/ticket-rules";

// Colors follow the theme table in PLAN.md.
// TODO (Phase 6): turn the priority pills into starbursts.

const STATUS: Record<Status, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-status-open text-white" },
  in_progress: { label: "In progress", className: "bg-status-progress text-charcoal" },
  resolved: { label: "Resolved", className: "bg-status-resolved text-white" },
  closed: { label: "Closed", className: "bg-status-closed text-white" },
};

const PRIORITY: Record<Priority, { label: string; className: string }> = {
  low: { label: "Low", className: "border-chrome bg-white text-charcoal" },
  medium: { label: "Medium", className: "border-teal bg-white text-teal" },
  high: { label: "High", className: "border-orange bg-orange text-white" },
  critical: { label: "Critical!", className: "border-critical bg-critical text-white" },
};

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS).map(([k, v]) => [k, v.label])
) as Record<Status, string>;

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${s.className}`}>
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  return (
    <span className={`inline-block rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${p.className}`}>
      {p.label}
    </span>
  );
}
