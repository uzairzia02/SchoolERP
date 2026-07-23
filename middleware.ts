import NextAuth from "next-auth";
import { authConfig } from "@/config/auth.config";
import { PUBLIC_ROUTES, ROLE_DASHBOARD_ROUTES } from "@/constants/routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextRequest & { auth: { user?: { role: UserRole } } | null }) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isPublicMarketingRoute = PUBLIC_ROUTES.some(
    (route) => route !== "/login" && (pathname === route || pathname.startsWith(`${route}/`))
  );
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isAuthApiRoute = pathname.startsWith("/api/auth");
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = /\.(ico|png|jpg|svg|css|js|woff2?)$/.test(pathname);

  // Always let these through untouched
  if (isPublicMarketingRoute || isAuthApiRoute || isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const justLoggedOut = nextUrl.searchParams.get("loggedOut") === "true";

  if (isLoginRoute) {
    // 🔥 NEW: Agar user ne abhi logout kiya hai (loggedOut=true), to login page rehne do
    if (justLoggedOut) {
      const response = NextResponse.next();
      
      // Force expire all auth cookies at middleware level
      response.cookies.set("__Secure-authjs.session-token", "", { 
        maxAge: 0, 
        path: "/",
        secure: true,
        sameSite: "lax"
      });
      response.cookies.set("authjs.session-token", "", { 
        maxAge: 0, 
        path: "/",
        sameSite: "lax"
      });
      response.cookies.set("__Host-authjs.csrf-token", "", { 
        maxAge: 0, 
        path: "/",
        secure: true,
        sameSite: "lax"
      });
      response.cookies.set("__Secure-authjs.callback-url", "", { 
        maxAge: 0, 
        path: "/",
        secure: true,
        sameSite: "lax"
      });
      response.cookies.set("authjs.callback-url", "", { 
        maxAge: 0, 
        path: "/"
      });
      
      // Clean URL — remove query params after processing
      const cleanUrl = nextUrl.clone();
      cleanUrl.searchParams.delete("loggedOut");
      
      return NextResponse.redirect(cleanUrl);
    }

    // Already logged in? Bounce away from the login page to the right dashboard.
    if (isLoggedIn) {
      const role = req.auth!.user!.role;
      const dest = ROLE_DASHBOARD_ROUTES[role] ?? "/dashboard";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return NextResponse.next();
  }

  // Everything else is a protected route.
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|api/uploadthing).*)",
  ],
};