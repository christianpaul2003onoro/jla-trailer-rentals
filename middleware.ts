// middleware.ts
import { NextResponse, NextRequest } from "next/server";

const COOKIE_NAME = "jla_admin";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  // Protect the admin app pages
  if (url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login")) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    const need   = process.env.ADMIN_COOKIE_SECRET || "";
    if (!cookie || !need || cookie !== need) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", url.pathname + url.search);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
