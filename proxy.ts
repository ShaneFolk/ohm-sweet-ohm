import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session-token";

// Runs before every page loads (Next.js 16's name for "middleware").
// It only checks the signed cookie, with no database call, to decide where to send people:
//   - logged out, any page except /login  -> /login
//   - logged in, visiting /login          -> home
//   - employee, visiting /admin/*         -> /tickets
// This is a convenience, not the security wall: API routes still check the
// session themselves, and so will pages that load data (Phase 3+).
export async function proxy(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
  const onLogin = request.nextUrl.pathname === "/login";

  if (user && onLogin) {
    // TODO (Phase 3): send to /tickets once it exists.
    return NextResponse.redirect(new URL("/", request.url));
  }

  // IT-only pages. Employees (including right after a demo switch) go to /tickets.
  // The /admin pages and their APIs will check the role themselves too (Phase 4).
  if (user && user.role !== "it_staff" && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/tickets", request.url));
  }

  if (!user && !onLogin) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // An expired or tampered cookie is useless, so clear it while we're here.
    if (request.cookies.has(COOKIE_NAME)) response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes (they return 401 themselves), Next.js internals, and any
  // file with an extension (favicon.ico, images) so assets always load.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
