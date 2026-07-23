"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Har route change par session validate karo
  useEffect(() => {
    const validateSession = async () => {
      // Login page par check na karo
      if (pathname.startsWith("/login")) return;

      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok || res.status === 401) {
          console.log("Session invalid, redirecting to login");
          router.replace("/login?loggedOut=true");
        }
      } catch (error) {
        console.error("Session validation failed", error);
      }
    };

    validateSession();
  }, [pathname, router]);

  // Back/Forward button detect — SABSE IMPORTANT
  useEffect(() => {
    const handlePopState = () => {
      fetch("/api/auth/session")
        .then((res) => {
          if (!res.ok || res.status === 401) {
            router.replace("/login?loggedOut=true");
          }
        })
        .catch(() => {
          router.replace("/login?loggedOut=true");
        });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}