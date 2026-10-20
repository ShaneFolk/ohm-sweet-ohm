"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINK = "font-bold text-teal hover:underline";

// The header's About link (to the home page). On the home page itself it
// turns into a way in: "Log in" for visitors, "Back to tickets" for people
// already signed in.
export default function AboutNavLink({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  if (pathname !== "/") return <StaticAboutLink />;
  return loggedIn ? (
    <Link href="/tickets" className={LINK}>
      ← Back to tickets
    </Link>
  ) : (
    <Link href="/login" className={LINK}>
      ← Log in
    </Link>
  );
}

// Shown while the session check is still loading.
export function StaticAboutLink() {
  return (
    <Link href="/" className={LINK}>
      About
    </Link>
  );
}
