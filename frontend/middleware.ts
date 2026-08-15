import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths accessible without authentication
// /invite/*   = reviewer read-only course link (no login required for reviewers)
// /print/*    = print-preview (public)
// /public/*   = external reviewer portal (PIN-gated, no login required)
const PUBLIC_PREFIXES = [
  "/login",
  "/invite",
  "/print",
  "/public",
  "/_next",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("curriculum_access")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
