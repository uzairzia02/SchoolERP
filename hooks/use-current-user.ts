"use client";

import { useSession } from "next-auth/react";
import type { AuthUser } from "@/types/globals.types";

export function useCurrentUser(): AuthUser | null {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return session.user as AuthUser;
}