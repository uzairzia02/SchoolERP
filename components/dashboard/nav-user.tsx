"use client";

import { useState } from "react";
import { LogOut, User, Settings, ChevronDown, Loader2 } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import { getInitials } from "@/lib/utils";
import type { AuthUser } from "@/types/globals.types";
import Link from "next/link";

interface NavUserProps {
  user: AuthUser;
}

export function NavUser({ user }: NavUserProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logoutAction();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? ""}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            getInitials(user.name ?? user.email)
          )}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium leading-none truncate max-w-[120px]">
            {user.name}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
            {user.schoolName}
          </p>
        </div>
        <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-popover shadow-lg">
            {/* User info */}
            <div className="border-b px-3 py-2.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Menu items */}
            <div className="p-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </Link>
            </div>

            <div className="border-t p-1">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}