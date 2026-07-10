import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2, Calendar, Star, Users, Shield,
  CreditCard, Bell, FileText, Settings,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Settings" };

const SETTINGS_SECTIONS = [
  {
    title: "School Profile",
    description: "School name, address, contact details, affiliation",
    href: "/dashboard/settings/school",
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    title: "Academic Settings",
    description: "Current session, terms, houses/groups, timezone",
    href: "/dashboard/settings/academic",
    icon: Calendar,
    color: "bg-violet-500",
  },
  {
    title: "Grading System",
    description: "Grade scales, GPA, passing marks configuration",
    href: "/dashboard/settings/grading",
    icon: Star,
    color: "bg-yellow-500",
  },
  {
    title: "User Accounts",
    description: "Create, activate, deactivate, reset passwords",
    href: "/dashboard/settings/users",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    title: "Roles & Permissions",
    description: "View what each role can access and do",
    href: "/dashboard/settings/roles",
    icon: Shield,
    color: "bg-red-500",
  },
  {
    title: "Fee & Finance Settings",
    description: "Bank account details, passing marks threshold",
    href: "/dashboard/settings/fees",
    icon: CreditCard,
    color: "bg-teal-500",
  },
  {
    title: "SMS & Notifications",
    description: "SMS gateway, API keys, message templates",
    href: "/dashboard/settings/notifications",
    icon: Bell,
    color: "bg-orange-500",
  },
  {
    title: "Audit Logs",
    description: "Track all system changes and user activity",
    href: "/dashboard/settings/audit",
    icon: FileText,
    color: "bg-gray-500",
  },
];

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!["PRINCIPAL", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-sm text-muted-foreground">
            System configuration and control panel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-all hover:border-primary/30 group"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${section.color} mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold font-display text-sm mb-1">{section.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}