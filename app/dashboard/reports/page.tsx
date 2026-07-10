import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3, ClipboardCheck, GraduationCap,
  CreditCard, Banknote, Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Reports" };

const REPORT_CARDS = [
  {
    title: "Attendance Report",
    description: "Student-wise attendance with percentages, low attendance alerts",
    href: "/dashboard/reports/attendance",
    icon: ClipboardCheck,
    color: "bg-blue-500/10 text-blue-600",
    iconBg: "bg-blue-500",
  },
  {
    title: "Student Report",
    description: "Complete student list with parent info, class, section details",
    href: "/dashboard/reports/students",
    icon: GraduationCap,
    color: "bg-emerald-500/10 text-emerald-600",
    iconBg: "bg-emerald-500",
  },
  {
    title: "Fee Report",
    description: "Fee collection, pending, overdue with full payment details",
    href: "/dashboard/reports/fees",
    icon: CreditCard,
    color: "bg-teal-500/10 text-teal-600",
    iconBg: "bg-teal-500",
  },
  {
    title: "Payroll Report",
    description: "Monthly salary breakdown with allowances and deductions",
    href: "/dashboard/reports/payroll",
    icon: Banknote,
    color: "bg-violet-500/10 text-violet-600",
    iconBg: "bg-violet-500",
  },
  {
    title: "Staff Report",
    description: "Teachers and employees with full HR details, status, offboarding",
    href: "/dashboard/reports/staff",
    icon: Users,
    color: "bg-orange-500/10 text-orange-600",
    iconBg: "bg-orange-500",
  },
];

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!["PRINCIPAL", "HR", "ACCOUNTANT", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate detailed reports with CSV export and print support
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border bg-card p-6 hover:shadow-md transition-all hover:border-primary/30 group"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold font-display mb-1">{card.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}