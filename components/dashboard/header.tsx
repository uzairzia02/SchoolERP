"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavUser } from "@/components/dashboard/nav-user";
import { USER_ROLE_LABELS } from "@/constants/enums";
import type { AuthUser } from "@/types/globals.types";

interface HeaderProps {
  user: AuthUser;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-4 border-b bg-card px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border bg-background pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Role Badge */}
        <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {USER_ROLE_LABELS[user.role]}
        </span>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <NavUser user={user} />
      </div>
    </header>
  );
}