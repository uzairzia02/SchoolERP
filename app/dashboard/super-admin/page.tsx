import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getSuperAdminStats,
  getMonthlyEnrollment,
  getMonthlyFeeCollection,
} from "@/features/dashboard/super-admin/actions/stats.actions";
import { StatsCards } from "@/features/dashboard/super-admin/components/stats-cards";
import { EnrollmentChart } from "@/features/dashboard/super-admin/components/enrollment-chart";
import { FeeChart } from "@/features/dashboard/super-admin/components/fee-chart";
import { RecentActivity } from "@/features/dashboard/super-admin/components/recent-activity";
import { db } from "@/lib/db";
import { approveLeave, rejectLeave } from "@/features/leaves/actions/leave.actions";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CalendarOff } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  ANNUAL: "Annual",
  MATERNITY: "Maternity",
  PATERNITY: "Paternity",
  UNPAID: "Unpaid",
};

export default async function SuperAdminDashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [{ stats, recentStudents, upcomingEvents }, enrollmentData, feeData, pendingLeaves] =
    await Promise.all([
      getSuperAdminStats(),
      getMonthlyEnrollment(),
      getMonthlyFeeCollection(),
      // 🔥 Pending leaves fetch karo
      db.leave.findMany({
        where: {
          schoolId: session.user.schoolId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          reason: true,
          status: true,
          teacher: {
            select: { firstName: true, lastName: true },
          },
          employee: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session.user.schoolName} — Overview
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {new Date().toLocaleDateString("en-PK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Academic Year {new Date().getFullYear()}–
            {new Date().getFullYear() + 1}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnrollmentChart data={enrollmentData} />
        <FeeChart data={feeData} />
      </div>

      {/* 🔥 Pending Leaves Section */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold font-display text-sm">
              Pending Leave Requests
            </h3>
          </div>
          <Link
            href="/dashboard/leaves?status=PENDING"
            className="text-xs text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarOff className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending leave requests
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingLeaves.map((leave) => {
              const staff = leave.teacher ?? leave.employee;
              return (
                <div
                  key={leave.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {staff
                        ? `${staff.firstName} ${staff.lastName}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {LEAVE_TYPE_LABELS[leave.type]} · {leave.totalDays} day(s)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(leave.startDate)} —{" "}
                      {formatDate(leave.endDate)}
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 max-w-md truncate">
                        Reason: {leave.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    <form action={approveLeave.bind(null, leave.id)}>
                      <button
                        type="submit"
                        className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 transition-colors"
                      >
                        Approve
                      </button>
                    </form>
                    {/* Reject Button */}
                    <form action={rejectLeave.bind(null, leave.id)}>
                      <button
                        type="submit"
                        className="text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <RecentActivity
        recentStudents={recentStudents}
        upcomingEvents={upcomingEvents}
      />
    </div>
  );
}