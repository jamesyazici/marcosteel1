import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;

  // Only run on /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = req.cookies.get("admin_token")?.value;

  // If no token, redirect to login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set(
      "next",
      pathname + (searchParams.toString() ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(url);
  }

  // Otherwise allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
