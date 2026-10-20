import type { ReactNode } from "react";

// The Atomic Age atom: three orbits around an orange nucleus.
// Purely decorative (aria-hidden), so screen readers skip it.
// Orbits use currentColor, so set the color with a text-* class.
// `spin` slowly turns it (for loading states); people who've asked their
// computer to reduce motion get a still atom instead.
export default function Atom({ className = "h-6 w-6", spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={`${className} ${spin ? "motion-safe:animate-[spin_4s_linear_infinite]" : ""}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.5">
        <ellipse cx="24" cy="24" rx="21" ry="8" />
        <ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(120 24 24)" />
      </g>
      <circle cx="24" cy="24" r="4.5" fill="var(--color-orange-glow)" />
      {/* one electron on each orbit */}
      <circle cx="45" cy="24" r="2.5" fill="var(--color-mustard)" />
      <circle cx="13.5" cy="42.2" r="2.5" fill="var(--color-mustard)" />
      <circle cx="13.5" cy="5.8" r="2.5" fill="var(--color-mustard)" />
    </svg>
  );
}

/** A loading card: the spinning atom plus a line of '50s-flavored copy. */
export function LoadingCard({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-chrome bg-white/60 p-8 text-center font-bold text-teal ${className}`}
    >
      <Atom className="h-12 w-12 text-teal-glow" spin />
      <p>{message}</p>
    </div>
  );
}

/**
 * An empty-state card: a picture (a still atom unless `art` is given, e.g. the
 * robot), a playful headline, and a plain explanation.
 */
export function EmptyCard({
  title,
  children,
  art,
  className = "",
}: {
  title: string;
  children: ReactNode;
  art?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border-2 border-dashed border-chrome bg-white/60 p-8 text-center ${className}`}>
      <div className="flex justify-center">{art ?? <Atom className="h-10 w-10 text-teal" />}</div>
      <p className="mt-3 font-display text-xl text-teal">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
