import DatabaseDiagram from "./DatabaseDiagram";

// The technical half of the About page, written for engineers: the stack,
// how a request is checked, the database, and the security and spam limits.
// Numbers here mirror the code (lib/rate-limit.ts, lib/caps.ts).

const SPEC = [
  ["Framework", "Next.js 16 (App Router, TypeScript): pages and API routes in one app"],
  ["Database", "PostgreSQL on Neon, queried with plain parameterized SQL (no ORM)"],
  ["Hosting", "Vercel, with a nightly Vercel Cron job that resets the demo"],
  ["Sign-in", "Signed JWT (jose) in an httpOnly cookie; passwords hashed with bcrypt"],
  ["Validation", "Zod schemas on every request body, shared with the browser forms"],
  ["Styling", "Tailwind CSS v4 with a custom “Atomic Age Appliance” theme"],
];

// A real sequence: every API request passes these in order.
const REQUEST_PATH = [
  ["proxy.ts", "Sends logged-out visitors to the login page before any page loads (a convenience, not the lock)."],
  ["Session and role check", "Is the signed cookie valid? Is this role allowed here? If not: 401 or 403."],
  ["Rate limit", "Too many requests this minute? 429, try again shortly."],
  ["Zod validation", "Is the request body the right shape and size? If not: 400 with the reason."],
  ["Data layer", "Is this ticket yours, or are you IT? If not: 404, so other people's tickets stay invisible."],
  ["PostgreSQL", "Only parameterized SQL ($1, $2), so typed text can never become a command."],
];

const LIMITS = [
  ["Log in (password or demo)", "5 per minute each", "per IP address"],
  ["Create a ticket", "5 per minute", "per user"],
  ["Add a note", "10 per minute", "per user"],
  ["Any other change", "30 per minute", "per user"],
  ["Open tickets", "10 at a time", "per user (per visitor on demo accounts)"],
  ["Notes", "20", "per ticket"],
  ["Whole demo", "300 tickets, 1,000 notes", "until the nightly reset"],
];

export default function UnderTheHood() {
  return (
    <section id="under-the-hood" aria-labelledby="hood-title" className="grid scroll-mt-6 grid-cols-1 gap-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange">Spec sheet · Model OSO-3000</p>
        <h2 id="hood-title" className="mt-1 font-display text-3xl text-teal">Under the hood</h2>
        <p className="mt-2 max-w-prose">For the engineers in the audience: what it&apos;s built with and how it stays safe.</p>
      </div>

      {/* A chrome "model plate", like the one on the back of an appliance */}
      <dl className="appliance-panel grid gap-x-6 gap-y-3 p-6 sm:grid-cols-[10rem_1fr] sm:p-8">
        {SPEC.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-bold text-orange">{label}</dt>
            <dd className="min-w-0">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="font-display text-2xl text-teal">What happens on every request</h3>
        <ol className="mt-4 grid gap-3">
          {REQUEST_PATH.map(([step, what], i) => (
            <li key={step} className="appliance-card flex gap-4 p-4">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mustard font-display text-charcoal"
              >
                {i + 1}
              </span>
              <p className="min-w-0">
                <span className="font-bold">{step}.</span> {what}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="font-display text-2xl text-teal">The database</h3>
        <p className="mb-4 mt-2 max-w-prose">
          Seven PostgreSQL tables. Lengths and allowed values are enforced by the database too, not just the app.
        </p>
        <DatabaseDiagram />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="font-display text-2xl text-teal">Security features</h3>
          <ul className="mt-3 grid list-disc gap-2 pl-5">
            <li>Who did what (ticket owner, note author, log entry) always comes from the session, never the form.</li>
            <li>Password hashes never leave the server, and login errors never say whether the email exists.</li>
            <li>Security headers block framing (clickjacking) and content-type guessing.</li>
            <li>The nightly reset route only answers to a secret that Vercel holds.</li>
            <li>Demo visitors are told apart by a one-way hash of their IP, never the IP itself.</li>
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-2xl text-teal">Spam limits</h3>
          <div className="mt-3 overflow-x-auto rounded-2xl border-2 border-chrome bg-white/70">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-dark">
                <tr>
                  <th scope="col" className="px-3 py-2">Action</th>
                  <th scope="col" className="px-3 py-2">Limit</th>
                  <th scope="col" className="px-3 py-2">Counted</th>
                </tr>
              </thead>
              <tbody>
                {LIMITS.map(([action, limit, per]) => (
                  <tr key={action} className="border-t border-chrome">
                    <td className="px-3 py-2">{action}</td>
                    <td className="px-3 py-2 font-bold">{limit}</td>
                    <td className="px-3 py-2">{per}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
