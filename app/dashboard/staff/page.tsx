import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffStats } from "@/features/dashboard/shared/actions/staff.actions";
import { formatDate, formatRelative, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Briefcase, ClipboardCheck, CalendarDays, Wallet, PartyPopper,
  Megaphone, CheckCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Staff Dashboard" };

const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700",
  APPROVED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-red-500/10 text-red-700",
  CANCELLED: "bg-gray-500/10 text-gray-700",
};

export default async function StaffDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getStaffStats();

  // No Employee record found for this user — not applicable to this account
  if (!stats) redirect("/login");

  const {
    employeeName, department, designation, attendanceMarkedToday,
    myLeaveRequests, latestPayroll, upcomingHolidays, recentAnnouncements,
  } = stats;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {employeeName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {designation} • {department} • {formatDate(new Date())}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
          label="Attendance Today"
          value={attendanceMarkedToday ? "Marked" : "Pending"}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5 text-green-600" />}
          label="Last Payroll"
          value={latestPayroll ? formatCurrency(latestPayroll.netSalary) : "Not processed"}
          iconBg="bg-green-500/10"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-amber-600" />}
          label="Leave Requests"
          value={myLeaveRequests.length}
          iconBg="bg-amber-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Leave Requests */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              My Leave Requests
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/staff/leaves">View All</Link>
            </Button>
          </div>

          {myLeaveRequests.length === 0 ? (
            <EmptyState icon={<CheckCircle className="h-8 w-8" />} text="No leave requests yet" />
          ) : (
            <div className="space-y-3">
              {myLeaveRequests.map((l: any) => (
                <div key={l.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{l.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(l.fromDate)} – {formatDate(l.toDate)}
                    </p>
                  </div>
                  <Badge className={`${LEAVE_STATUS_COLORS[l.status] ?? ""} border-0 font-normal shrink-0`}>
                    {l.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Holidays */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-muted-foreground" />
              Upcoming Holidays
            </h2>
          </div>

          {upcomingHolidays.length === 0 ? (
            <EmptyState icon={<PartyPopper className="h-8 w-8" />} text="No upcoming holidays" />
          ) : (
            <div className="space-y-2">
              {upcomingHolidays.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm font-medium">{h.name}</p>
                  <Badge variant="outline" className="font-normal">{formatDate(h.date)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            Recent Announcements
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/staff/announcements">View All</Link>
          </Button>
        </div>

        {recentAnnouncements.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-8 w-8" />} text="No recent announcements" />
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map((a: any) => (
              <div key={a.id} className="border-b last:border-0 pb-3 last:pb-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, iconBg,
}: {
  icon: React.ReactNode; label: string; value: string | number; iconBg: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
      {icon}
      <p className="text-sm mt-2">{text}</p>
    </div>
  );
}
