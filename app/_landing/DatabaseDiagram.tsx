// ER diagram of db/schema.sql, drawn as SVG so it scales and stays sharp.
// Crow's-foot lines: two bars = "one", a three-pronged foot = "many".
// Lines are drawn for the relationships around tickets; every foreign key
// row also names the table it points to, so nothing depends on the lines alone.
// (tickets' columns are listed in an order that keeps the lines from crossing.)

type Col = { name: string; type: string; key?: "PK" | "FK"; ref?: string };
type Table = { name: string; x: number; y: number; cols: Col[]; note?: string };

const W = 260; // table width
const HEAD = 34; // title bar height
const ROW = 22; // row height

const TABLES: Table[] = [
  {
    name: "departments",
    x: 40,
    y: 20,
    cols: [
      { name: "id", type: "serial", key: "PK" },
      { name: "name", type: "text, unique" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "users",
    x: 40,
    y: 190,
    cols: [
      { name: "id", type: "serial", key: "PK" },
      { name: "first_name", type: "text" },
      { name: "last_name", type: "text" },
      { name: "email", type: "text, unique" },
      { name: "password_hash", type: "text" },
      { name: "role", type: "employee | it_staff" },
      { name: "department_id", type: "int", key: "FK", ref: "departments" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "tickets",
    x: 370,
    y: 20,
    cols: [
      { name: "id", type: "serial", key: "PK" },
      { name: "title", type: "text, 3–120" },
      { name: "description", type: "text, ≤ 2000" },
      { name: "priority", type: "low … critical" },
      { name: "status", type: "open … closed" },
      { name: "department_id", type: "int", key: "FK", ref: "departments" },
      { name: "submitted_by", type: "int", key: "FK", ref: "users" },
      { name: "assigned_to", type: "int", key: "FK", ref: "users" },
      { name: "submitter_ip_hash", type: "text" },
      { name: "created_at", type: "timestamptz" },
      { name: "updated_at", type: "timestamptz" },
    ],
  },
  {
    name: "ticket_assignments",
    x: 700,
    y: 20,
    cols: [
      { name: "id", type: "serial", key: "PK" },
      { name: "ticket_id", type: "int", key: "FK", ref: "tickets" },
      { name: "assigned_to", type: "int", key: "FK", ref: "users" },
      { name: "assigned_by", type: "int", key: "FK", ref: "users" },
      { name: "assigned_at", type: "timestamptz" },
    ],
  },
  {
    name: "ticket_notes",
    x: 700,
    y: 230,
    cols: [
      { name: "id", type: "serial", key: "PK" },
      { name: "ticket_id", type: "int", key: "FK", ref: "tickets" },
      { name: "user_id", type: "int", key: "FK", ref: "users" },
      { name: "note", type: "text, 1–1000" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "activity_logs",
    x: 370,
    y: 350,
    note: "no foreign keys: history outlives deleted tickets",
    cols: [
      { name: "id", type: "serial", key: "PK" },
      { name: "action", type: "text" },
      { name: "user_id", type: "int" },
      { name: "ticket_id", type: "int" },
      { name: "details", type: "text" },
      { name: "details_json", type: "jsonb" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "rate_limits",
    x: 700,
    y: 440,
    note: "one counter per key per minute",
    cols: [
      { name: "key", type: "text", key: "PK" },
      { name: "window_start", type: "timestamptz", key: "PK" },
      { name: "count", type: "int" },
    ],
  },
];

const tableHeight = (t: Table) => HEAD + ROW * t.cols.length + 10;

export default function DatabaseDiagram() {
  return (
    <figure className="min-w-0">
      {/* Wide drawing: scrolls sideways inside its own box on small phones */}
      <div className="overflow-x-auto rounded-2xl border-2 border-chrome bg-white/70 p-3">
        <svg
          viewBox="0 0 1000 620"
          role="img"
          aria-label="Database diagram"
          aria-describedby="erd-desc"
          className="w-full min-w-[720px]"
        >
          <Relationships />
          {TABLES.map((t) => (
            <TableBox key={t.name} t={t} />
          ))}

          {/* legend */}
          <g className="font-sans" fontSize="13" fill="var(--color-charcoal)">
            <KeyBadge x={40} y={596} label="PK" />
            <text x={70} y={600}>primary key</text>
            <KeyBadge x={170} y={596} label="FK" />
            <text x={200} y={600}>foreign key (→ the table it points to)</text>
            <g stroke="var(--color-charcoal)" strokeWidth="1.5" fill="none">
              <path d="M480 596 H540" />
              <One x={480} y={596} dir={1} />
              <Many x={540} y={596} />
            </g>
            <text x={552} y={600}>one-to-many</text>
          </g>
        </svg>
      </div>
      <p id="erd-desc" className="sr-only">
        Seven tables. A department has many users and many tickets. A user submits many tickets and is assigned many
        tickets. A ticket has many assignment-history rows and many notes. Activity logs and rate limits stand alone.
      </p>
      <figcaption className="mt-2 text-sm text-charcoal/80">
        Every table from <code className="font-mono">db/schema.sql</code>. Deleting a ticket also deletes its notes and
        assignment history; the activity log keeps its record.
      </figcaption>
    </figure>
  );
}

function TableBox({ t }: { t: Table }) {
  const h = tableHeight(t);
  return (
    <g>
      <rect x={t.x} y={t.y} width={W} height={h} rx="10" fill="var(--color-enamel)" stroke="var(--color-chrome-dark)" strokeWidth="2" />
      {/* title bar: rounded on top only */}
      <path
        d={`M${t.x} ${t.y + HEAD} V${t.y + 10} a10 10 0 0 1 10 -10 H${t.x + W - 10} a10 10 0 0 1 10 10 V${t.y + HEAD} Z`}
        fill="var(--color-teal)"
      />
      <text x={t.x + 12} y={t.y + 22} fontSize="15" fill="#fff" className="font-display">
        {t.name}
      </text>
      {t.cols.map((c, i) => {
        const y = t.y + HEAD + ROW * i + 15;
        return (
          <g key={c.name} className="font-mono" fontSize="12">
            {c.key && <KeyBadge x={t.x + 10} y={y - 4} label={c.key} />}
            <text x={t.x + 40} y={y} fill="var(--color-charcoal)" fontWeight={c.key === "PK" ? 600 : 400}>
              {c.name}
            </text>
            <text x={t.x + W - 10} y={y} textAnchor="end" fill={c.ref ? "var(--color-orange)" : "var(--color-charcoal)"} opacity={c.ref ? 1 : 0.7}>
              {c.ref ? `→ ${c.ref}` : c.type}
            </text>
          </g>
        );
      })}
      {t.note && (
        <text x={t.x} y={t.y + h + 16} fontSize="12" fill="var(--color-charcoal)" opacity="0.8" className="font-sans italic">
          {t.note}
        </text>
      )}
    </g>
  );
}

function KeyBadge({ x, y, label }: { x: number; y: number; label: "PK" | "FK" }) {
  return (
    <g>
      <rect x={x} y={y - 8} width="24" height="16" rx="4" fill={label === "PK" ? "var(--color-mustard)" : "var(--color-orange-glow)"} />
      <text x={x + 12} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-charcoal)" className="font-sans">
        {label}
      </text>
    </g>
  );
}

// The "one" end: two short bars across the line. dir = which way the line leaves the box.
function One({ x, y, dir }: { x: number; y: number; dir: 1 | -1 }) {
  return (
    <>
      <path d={`M${x + 6 * dir} ${y - 6} V${y + 6}`} />
      <path d={`M${x + 10 * dir} ${y - 6} V${y + 6}`} />
    </>
  );
}

// The "many" end: a crow's foot touching the box at x (the line arrives from the left).
function Many({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 12} ${y} L${x} ${y - 7} M${x - 12} ${y} L${x} ${y} M${x - 12} ${y} L${x} ${y + 7}`} />;
}

function Relationships() {
  // Row centers, from the layout above
  // departments.id 65 · users.id 235 · users.department_id 367
  // tickets.id 65 · tickets.department_id 175 · submitted_by 197 · assigned_to 219
  // ticket_assignments.ticket_id 87 · ticket_notes.ticket_id 297
  return (
    <g fill="none" stroke="var(--color-charcoal)" strokeWidth="1.5" strokeLinejoin="round">
      {/* departments → users (routed down the left side) */}
      <path d="M40 65 H22 V367 H40" />
      <One x={40} y={65} dir={-1} />
      <Many x={40} y={367} />

      {/* departments → tickets */}
      <path d="M300 65 H360 V175 H370" />
      <One x={300} y={65} dir={1} />
      <Many x={370} y={175} />

      {/* users → tickets (submitted_by, assigned_to) */}
      <path d="M300 235 H340 V197 H370" />
      <path d="M340 235 H350 V219 H370" />
      <One x={300} y={235} dir={1} />
      <Many x={370} y={197} />
      <Many x={370} y={219} />

      {/* tickets → ticket_assignments and ticket_notes */}
      <path d="M630 65 H665 V87 H700" />
      <path d="M665 87 V297 H700" />
      <One x={630} y={65} dir={1} />
      <Many x={700} y={87} />
      <Many x={700} y={297} />
    </g>
  );
}
