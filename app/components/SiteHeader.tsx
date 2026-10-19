import { Suspense } from "react";
import Link from "next/link";
import { getSessionUser, isDemoAccount } from "@/lib/auth";
import DemoRoleToggle from "./DemoRoleToggle";
import LogoutButton from "./LogoutButton";

// The logo part is static. Only UserMenu reads the session cookie, so it sits
// inside <Suspense> (Next.js requires that) and streams in after the rest.
export default function SiteHeader() {
  return (
    <header className="border-b-4 border-chrome bg-white/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/tickets" className="font-display text-xl text-teal sm:text-2xl">
          Ohm Sweet Ohm <span className="text-orange">IT Support</span>
        </Link>
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserMenu() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
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
    </div>
  );
}
