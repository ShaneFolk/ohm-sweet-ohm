import { Suspense } from "react";
import Link from "next/link";
import { getSessionUser, isDemoAccount } from "@/lib/auth";
import AboutNavLink, { StaticAboutLink } from "./AboutNavLink";
import Atom from "./Atom";
import DemoRoleToggle from "./DemoRoleToggle";
import LogoutButton from "./LogoutButton";

// The logo part is static. Only UserMenu reads the session cookie, so it sits
// inside <Suspense> (Next.js requires that) and streams in after the rest.
export default function SiteHeader() {
  return (
    <header className="border-b-4 border-chrome bg-white/60">
      {/* On phones the links wrap under the logo, so center both rows there */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-4 py-3 sm:justify-between">
        <Link href="/tickets" className="flex items-center gap-2 font-display text-xl text-teal sm:text-2xl">
          <Atom className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span>
            Ohm Sweet Ohm <span className="text-orange">IT Support</span>
          </span>
        </Link>
        <Suspense fallback={<StaticAboutLink />}>
          <UserMenu />
        </Suspense>
      </div>
      {/* Visitors should know anything they add is temporary (see /api/cron/reset). */}
      <p className="bg-mustard/30 px-4 py-1 text-center text-xs font-bold">
        Demo data resets every night.
      </p>
    </header>
  );
}

async function UserMenu() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      {/* Everyone gets this, logged in or not */}
      <AboutNavLink loggedIn={!!user} />
      {user && <AccountControls user={user} />}
    </div>
  );
}

function AccountControls({ user }: { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>> }) {
  return (
    <>
      {user.role === "it_staff" && (
        <Link href="/admin/logs" className="font-bold text-teal hover:underline">
          Activity log
        </Link>
      )}
      <span>
        Hi, <span className="font-bold">{user.firstName}</span>
        {/* Demo accounts get the toggle instead of a plain role badge */}
        {!isDemoAccount(user.email) && (
          <span className="ml-2 rounded-full bg-cream-dark px-2 py-0.5 text-xs font-bold">
            {user.role === "it_staff" ? "IT Tech" : "Employee"}
          </span>
        )}
      </span>
      {isDemoAccount(user.email) && <DemoRoleToggle role={user.role} />}
      <LogoutButton />
    </>
  );
}
