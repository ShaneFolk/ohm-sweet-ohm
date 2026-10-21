import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Robot from "./components/Robot";
import TourButton from "./_landing/TourButton";
import UnderTheHood from "./_landing/UnderTheHood";

export const metadata: Metadata = {
  title: "Ohm Sweet Ohm IT Support | A help desk portfolio project",
  description: "A tour of Ohm Sweet Ohm IT Support, a full-stack help desk built by Shane Folk.",
};

// The home page. Public (proxy.ts lets logged-out visitors in) and fully
// static: it never reads the session, so it loads instantly. Laid out like a
// 1950s appliance brochure up top, with a plain technical spec sheet underneath.
// Its parts live in app/_landing (the underscore keeps that folder from
// becoming a URL).

const PORTFOLIO_URL = "https://shanefolk.com";
const GITHUB_URL = "https://github.com/ShaneFolk/ohm-sweet-ohm";

const FEATURES = [
  {
    pitch: "Two roles, one click!",
    plain: "Employees see only their own tickets. IT techs see and manage all of them. Demo visitors can flip between the two with the “Viewing as” switch.",
  },
  {
    pitch: "Checked at the door, every time!",
    plain: "The server re-checks who you are and what you're allowed to do on every request. Someone else's ticket simply comes back as “not found.”",
  },
  {
    pitch: "Teamwork, built right in!",
    plain: "Techs assign tickets to each other, change status and priority, and everyone trades notes on the ticket itself.",
  },
  {
    pitch: "A mainframe that never forgets!",
    plain: "Every change and sign-in lands in an amber activity log that only IT staff can open.",
  },
  {
    pitch: "Spam-resistant construction!",
    plain: "Rate limits and hard caps stop bots from flooding the demo, and visitors sharing a demo account can't lock each other out.",
  },
  {
    pitch: "Factory-fresh every morning!",
    plain: "A scheduled job resets the demo data every night, so every visitor starts with a tidy showroom.",
  },
];

export default function HomePage() {
  return (
    // grid-cols-1 caps the column at the screen width; without it, the wide
    // database diagram stretches the whole page on phones.
    <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-12 px-4 py-8">
      {/* The brochure cover */}
      <section className="appliance-panel grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-10">
        <Robot className="mx-auto h-36 w-auto sm:h-48" />
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange">Tomorrow Industries presents</p>
          <h1 className="mt-2 font-display text-3xl text-balance text-teal sm:text-5xl">
            Introducing the Ohm Sweet Ohm 3000!
          </h1>
          <p className="mt-2 font-display text-xl text-orange">The help desk of tomorrow, today!</p>
          <p className="mt-4 max-w-prose">
            A working IT help desk, built as a portfolio project by Shane Folk. Employees file tickets; technicians
            assign, update, and resolve them. Built with Next.js, PostgreSQL, and Vercel.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {/* For visitors who'd rather skip the tour. Logged-in people get
                sent on to their tickets by proxy.ts. */}
            <Link
              href="/login"
              className="rounded-full bg-orange px-6 py-2 font-display text-white shadow-[0_4px_0_var(--color-orange-dark)] transition hover:brightness-95 active:translate-y-0.5 active:shadow-none"
            >
              Dive right in →
            </Link>
            <a
              href="#tour"
              className="rounded-full bg-teal px-6 py-2 font-display text-white shadow-[0_4px_0_var(--color-teal-dark)] transition hover:bg-teal-dark active:translate-y-0.5 active:shadow-none"
            >
              Take it for a spin
            </a>
            <a
              href="#under-the-hood"
              className="rounded-full border-2 border-teal px-6 py-2 font-display text-teal transition hover:bg-teal hover:text-white"
            >
              See what&apos;s under the hood
            </a>
          </div>
        </div>
      </section>

      {/* Feature callouts, in '50s ad voice with a plain explanation under each */}
      <section aria-labelledby="features">
        <h2 id="features" className="font-display text-3xl text-teal">Look at all these features!</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.pitch} className="appliance-card p-5">
              <p className="font-display text-xl text-orange">{f.pitch}</p>
              <p className="mt-2">{f.plain}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The guided tour: a real sequence, so it's numbered */}
      <section id="tour" aria-labelledby="tour-title" className="scroll-mt-6">
        <h2 id="tour-title" className="font-display text-3xl text-teal">Take it for a spin</h2>
        <p className="mt-2">Three steps, about two minutes. No sign-up needed.</p>
        <ol className="mt-5 grid gap-4 lg:grid-cols-3">
          <TourStep n={1} title="Be the employee">
            <p>Log in as Penny from HR and file a ticket about anything that&apos;s on the fritz.</p>
            <TourButton role="employee" to="/tickets/new" label="Log in as Penny →" />
          </TourStep>
          <TourStep n={2} title="Be the technician">
            <p>
              Switch to Rex from IT (the “Viewing as” switch works too). Open Penny&apos;s ticket, assign a tech, and
              mark it resolved.
            </p>
            <TourButton role="it_staff" to="/tickets" label="Log in as Rex →" />
          </TourStep>
          <TourStep n={3} title="Check the mainframe">
            <p>Every step you just took is waiting in the amber activity log.</p>
            <TourButton role="it_staff" to="/admin/logs" label="Open the activity log →" />
          </TourStep>
        </ol>
      </section>

      <UnderTheHood />

      {/* Credits */}
      <section aria-labelledby="built-by" className="appliance-panel p-6 sm:p-8">
        <h2 id="built-by" className="font-display text-3xl text-teal">Built by Shane Folk</h2>
        <p className="mt-3 max-w-prose">
          Designed and built from the database up: schema, API, permissions, security, and every starburst.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-bold">
          <li>
            See more of my work in my portfolio:{" "}
            <a href={PORTFOLIO_URL} className="text-teal underline hover:text-teal-dark">
              shanefolk.com
            </a>
          </li>
          <li>
            <a href={GITHUB_URL} className="text-teal underline hover:text-teal-dark">
              Source code on GitHub
            </a>
          </li>
        </ul>
        <p className="mt-6 rounded-2xl bg-mustard/25 p-4">
          <span className="font-bold">My next goal</span> is building a storefront with a product showcase home page.
        </p>
      </section>
    </main>
  );
}

function TourStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="appliance-card grid content-start gap-3 p-5">
      <p className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal font-display text-lg text-white"
        >
          {n}
        </span>
        <span className="font-display text-xl text-teal">
          <span className="sr-only">Step {n}: </span>
          {title}
        </span>
      </p>
      {children}
    </li>
  );
}
