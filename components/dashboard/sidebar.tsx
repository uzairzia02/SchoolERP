"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Shield, GraduationCap, Users, BookOpen,
  Book, Calendar, ClipboardCheck, FileText, ClipboardList,
  Briefcase, Building2, UserPlus, Users2, CalendarOff, Bus,
  CreditCard, Banknote, Megaphone, CalendarDays, Newspaper,
  Image, BarChart3, Settings, Tag, Star, ChevronLeft,
  ChevronRight, BookMarked, UserCog, Layers, DollarSign, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_CONFIG } from "@/config/nav.config";
import type { UserRole } from "@prisma/client";
import type { NavItem } from "@/types/globals.types";
import { APP_CONFIG } from "@/config/app.config";

// ─────────────────────────────────────────────────────────────
// Icon Map
// ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Shield, GraduationCap, Users, BookOpen,
  Book, Calendar, ClipboardCheck, FileText, ClipboardList,
  Briefcase, Building2, UserPlus, Users2, CalendarOff, Bus,
  CreditCard, Banknote, Megaphone, CalendarDays, Newspaper,
  Image, BarChart3, Settings, Tag, Star, BookMarked, UserCog, Layers, DollarSign, Receipt,
};

// ─────────────────────────────────────────────────────────────
// Nav Item
// ─────────────────────────────────────────────────────────────

function NavItemComponent({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = ICON_MAP[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.title : undefined}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {!collapsed && <span className="truncate">{item.title}</span>}
      {!collapsed && item.badge !== undefined && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navGroups = NAV_CONFIG[role] ?? [];

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-[60px] items-center border-b px-4 shrink-0",
        collapsed ? "justify-center px-2" : "gap-3"
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold font-display text-sm truncate">
            {APP_CONFIG.shortName}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemComponent
                  key={`${item.title}-${item.href}`}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
