"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ClientAuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ClientAuthGuard({ children, allowedRoles }: ClientAuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Back/Forward button detect karne ke liye
    const handlePopState = () => {
      if (status === "unauthenticated") {
        router.replace("/login?loggedOut=true");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [status, router]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login?loggedOut=true");
      return;
    }

    // Role check
    if (session?.user?.role && !allowedRoles.includes(session.user.role)) {
      router.replace("/login?loggedOut=true");
      return;
    }
  }, [status, session, router, allowedRoles]);

  // Page visibility change — tab switch karke wapas aaye to check
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Re-validate session
        fetch("/api/auth/session").then((res) => {
          if (!res.ok || res.status === 401) {
            router.replace("/login?loggedOut=true");
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (session?.user?.role && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}