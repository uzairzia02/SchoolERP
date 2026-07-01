"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-white px-6 shadow-sm">
      {/* Search Bar (Left Side) */}
      <div className="hidden flex-1 items-center space-x-2 md:flex max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search everything..."
            className="w-full pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300"
          />
        </div>
      </div>

      {/* Mobile Menu Icon (Only visible on small screens) */}
      <div className="flex md:hidden">
        <Button variant="ghost" size="icon" className="text-slate-600">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right Side Actions (Notifications & User Profile) */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:bg-slate-50">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </Button>

        <div className="h-8 w-px bg-slate-200" />

        {/* User Info / Profile Dropdown Placeholder */}
        <div className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
            <User className="h-5 w-5" />
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-slate-700 leading-none">Admin User</p>
            <p className="text-xs text-slate-400 mt-0.5">Portal Management</p>
          </div>
        </div>
      </div>
    </header>
  );
}