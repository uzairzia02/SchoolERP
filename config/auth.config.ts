import type { NextAuthConfig } from "next-auth";
import { ROLE_DASHBOARD_ROUTES } from "@/constants/routes";
import type { UserRole } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  providers: [], 
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");

      if (isAuthPage) {
        if (isLoggedIn) {
          const role = auth.user.role as UserRole;
          const dest = ROLE_DASHBOARD_ROUTES[role] ?? "/dashboard";
          return Response.redirect(new URL(dest, nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname);
        return Response.redirect(
          new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
        );
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.schoolName = user.schoolName;
        token.schoolCode = user.schoolCode;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.schoolId = token.schoolId as string;
        session.user.schoolName = token.schoolName as string;
        session.user.schoolCode = token.schoolCode as string;
      }
      return session;
    },
  },
};