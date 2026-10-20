import type { Priority, Status } from "@/lib/ticket-rules";

// Colors follow the theme table in PLAN.md.

const STATUS: Record<Status, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-status-open text-white" },
  in_progress: { label: "In progress", className: "bg-status-progress text-charcoal" },
  resolved: { label: "Resolved", className: "bg-status-resolved text-white" },
  closed: { label: "Closed", className: "bg-status-closed text-white" },
};

// shape = the starburst's fill and outline; text = the label color;
// tilt = how far the "sticker" leans (critical leans the most).
const PRIORITY: Record<Priority, { label: string; shape: string; text: string; tilt: string }> = {
  low: { label: "Low", shape: "fill-white stroke-chrome", text: "text-charcoal", tilt: "-rotate-2" },
  medium: { label: "Medium", shape: "fill-white stroke-teal", text: "text-teal", tilt: "rotate-2" },
  high: { label: "High", shape: "fill-orange stroke-orange-dark", text: "text-white", tilt: "-rotate-3" },
  critical: { label: "Critical!", shape: "fill-critical stroke-critical", text: "text-white", tilt: "-rotate-6" },
};

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS).map(([k, v]) => [k, v.label])
) as Record<Status, string>;

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${s.className}`}>
      <span className="sr-only">Status: </span>
      {s.label}
    </span>
  );
}

// The points of an 18-spike starburst in a 100x100 box, worked out once.
// Spikes alternate between the outer edge (radius 50) and a little way in.
const SPIKES = 18;
const STARBURST = Array.from({ length: SPIKES * 2 }, (_, i) => {
  const r = i % 2 === 0 ? 50 : 41;
  const angle = (Math.PI * i) / SPIKES;
  return `${(50 + r * Math.sin(angle)).toFixed(1)},${(50 - r * Math.cos(angle)).toFixed(1)}`;
}).join(" ");

/** A '50s "SALE!" sticker: the label sits on a starburst stretched to fit it. */
export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  return (
    <span
      className={`relative inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold ${p.tilt} ${p.text}`}
    >
      {/* preserveAspectRatio="none" stretches the star to the label's size;
          non-scaling-stroke keeps the outline the same thickness anyway. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <polygon points={STARBURST} className={p.shape} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="relative">
        <span className="sr-only">Priority: </span>
        {p.label}
      </span>
    </span>
  );
}
