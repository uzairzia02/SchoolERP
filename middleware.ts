import NextAuth from "next-auth";
import { authConfig } from "@/config/auth.config";
import { PUBLIC_ROUTES } from "@/constants/routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Allow public routes & static files
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = /\.(ico|png|jpg|svg|css|js|woff2?)$/.test(pathname);

  if (isPublicRoute || isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};