// The Ohm Sweet Ohm mascot: a dome-headed robot with a '50s TV-cabinet body,
// an ohm sign (Ω) on its screen, a wrench for one hand, and one wheel.
// An original design (PLAN.md: round head, antenna, one wrench hand).
// Decorative only (aria-hidden), so screen readers skip it.
// Size it with a className (e.g. "h-28 w-auto"); the shape keeps its proportions.

const LINE = "var(--color-charcoal)";

export default function Robot({ className = "h-28 w-auto" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 240" className={className}>
      {/* springy antenna; the bulb glows softly (still for reduced motion) */}
      <path d="M100 54 l-7 -6 l14 -6 l-14 -6 l7 -6" fill="none" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      <circle
        cx="100"
        cy="22"
        r="8"
        fill="var(--color-mustard)"
        stroke={LINE}
        strokeWidth="3"
        className="motion-safe:animate-pulse"
      />

      {/* bendy arms; the right hand is a wrench */}
      <path d="M52 140 q-22 6 -22 28" fill="none" stroke={LINE} strokeWidth="7" strokeLinecap="round" />
      <path d="M148 140 q22 -4 28 -28" fill="none" stroke={LINE} strokeWidth="7" strokeLinecap="round" />
      <circle cx="30" cy="174" r="8" fill="var(--color-chrome)" stroke={LINE} strokeWidth="3" />
      {/* wrench head: a circle with an open jaw cut into the top */}
      <path
        d="M172.5 90.2 A13 13 0 1 0 183.5 90.2 L183.5 98 L172.5 98 Z"
        fill="var(--color-chrome)"
        stroke={LINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* dome head with an orange band */}
      <path d="M60 94 A40 40 0 0 1 140 94 Z" fill="var(--color-enamel)" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="85" cy="76" r="9" fill="#fff" stroke={LINE} strokeWidth="3" />
      <circle cx="115" cy="76" r="9" fill="#fff" stroke={LINE} strokeWidth="3" />
      <circle cx="87" cy="77" r="4" fill={LINE} />
      <circle cx="117" cy="77" r="4" fill={LINE} />
      <rect x="56" y="90" width="88" height="14" rx="7" fill="var(--color-orange-glow)" stroke={LINE} strokeWidth="3" />

      {/* TV-cabinet body with an ohm sign on the screen */}
      <rect x="50" y="106" width="100" height="86" rx="20" fill="var(--color-teal)" stroke={LINE} strokeWidth="4" />
      <rect x="64" y="118" width="72" height="48" rx="12" fill="var(--color-terminal)" />
      <text x="100" y="154" textAnchor="middle" fontSize="32" fill="var(--color-amber)" className="font-display">
        Ω
      </text>
      <circle cx="80" cy="178" r="5" fill="var(--color-mustard)" />
      <circle cx="100" cy="178" r="5" fill="var(--color-mustard)" />
      <circle cx="120" cy="178" r="5" fill="var(--color-cream)" />

      {/* one-wheel base */}
      <path d="M72 192 L128 192 L118 212 L82 212 Z" fill="var(--color-chrome)" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="222" r="11" fill={LINE} />
      <circle cx="100" cy="222" r="4" fill="var(--color-mustard)" />
    </svg>
  );
}
