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
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
};

export default async function SuperAdminDashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [{ stats, recentStudents, upcomingEvents }, enrollmentData, feeData] =
    await Promise.all([
      getSuperAdminStats(),
      getMonthlyEnrollment(),
      getMonthlyFeeCollection(),
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

      {/* Recent Activity */}
      <RecentActivity
        recentStudents={recentStudents}
        upcomingEvents={upcomingEvents}
      />
    </div>
  );
}