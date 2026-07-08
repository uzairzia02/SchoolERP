import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHRStats } from "@/features/dashboard/shared/actions/dashboard.actions";
import { formatDate, formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users, GraduationCap, Briefcase, CalendarOff,
  Building2, ClipboardCheck, Banknote, UserX,
} from "lucide-react";

export const metadata: Metadata = { title: "HR Dashboard" };

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CASUAL: "Casual", SICK: "Sick", ANNUAL: "Annual",
  MATERNITY: "Maternity", PATERNITY: "Paternity", UNPAID: "Unpaid",
};

export default async function HRDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "HR") redirect("/login");

  const stats = await getHRStats();

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold font-display">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Human Resources Overview
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: stats.totalStaff, sub: "active employees", icon: Users, color: "bg-blue-500" },
          { label: "Teachers", value: stats.activeTeachers, sub: `${stats.inactiveTeachers} inactive`, icon: GraduationCap, color: "bg-emerald-500" },
          { label: "Support Staff", value: stats.activeEmployees, sub: "non-teaching", icon: Briefcase, color: "bg-orange-500" },
          { label: "Pending Leaves", value: stats.pendingLeaves, sub: "need approval", icon: CalendarOff, color: "bg-yellow-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color} mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold font-display">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Attendance + Payroll */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Staff Attendance Today</p>
          </div>
          <p className={`text-3xl font-bold font-display ${stats.staffAttendanceRate >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
            {stats.staffAttendanceRate}%
          </p>
          <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${stats.staffAttendanceRate >= 80 ? "bg-emerald-500" : "bg-yellow-500"}`}
              style={{ width: `${stats.staffAttendanceRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Payroll This Month</p>
          </div>
          <p className="text-3xl font-bold font-display">{stats.payrollProcessedThisMonth}</p>
          <p className="text-xs text-muted-foreground mt-1">
            of {stats.totalStaffOnPayroll} employees processed
          </p>
          <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${stats.totalStaffOnPayroll > 0 ? Math.round((stats.payrollProcessedThisMonth / stats.totalStaffOnPayroll) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Leaves This Month</p>
          </div>
          <p className="text-3xl font-bold font-display">{stats.approvedLeavesThisMonth}</p>
          <p className="text-xs text-muted-foreground mt-1">approved leaves</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold font-display text-sm">Department Headcount</h3>
          </div>
          <div className="space-y-2">
            {stats.departments.slice(0, 8).map((dept) => {
              const total = dept._count.teachers + dept._count.employees;
              return (
                <Link
                  key={dept.id}
                  href={`/dashboard/departments/${dept.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <span className="text-sm">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    {dept._count.teachers > 0 && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-700 rounded-full px-2 py-0.5">
                        {dept._count.teachers} teachers
                      </span>
                    )}
                    {dept._count.employees > 0 && (
                      <span className="text-[10px] bg-orange-500/10 text-orange-700 rounded-full px-2 py-0.5">
                        {dept._count.employees} staff
                      </span>
                    )}
                    {total === 0 && (
                      <span className="text-[10px] text-muted-foreground">Empty</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">Pending Leave Requests</h3>
            </div>
            <Link href="/dashboard/leaves?status=PENDING" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>
          {stats.recentLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending leaves</p>
          ) : (
            <div className="space-y-2">
              {stats.recentLeaves.map((leave) => {
                const staff = leave.teacher ?? leave.employee;
                return (
                  <div key={leave.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {staff ? `${staff.firstName} ${staff.lastName}` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {LEAVE_TYPE_LABELS[leave.type]} · {leave.totalDays} day(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                      </p>
                    </div>
                    <Link href="/dashboard/leaves?status=PENDING">
                      <Badge variant="outline" className="text-[10px] text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}