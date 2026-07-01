"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from '@/components/ui/logout-button';

import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  // Menu items setup
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Staff Directory", href: "/staff" },
    { icon: ClipboardList, label: "Assessments", href: "/assessments" },
    { icon: BookOpen, label: "Courses & Policies", href: "/policies" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-slate-900 text-slate-300 md:sticky">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800 space-x-3 bg-slate-950">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-white tracking-wide">SMS System</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Action at Bottom */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <button
          onClick={() => console.log("Logging out...")}
          className="flex w-full items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 rounded-lg transition-colors group"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-400 transition-transform group-hover:translate-x-0.5" />
          <span>
            <LogoutButton />
          </span>
        </button>
      </div>
    </aside>
  );
}