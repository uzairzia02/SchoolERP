import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrincipalStats } from "@/features/dashboard/shared/actions/dashboard.actions";
import { formatDate, formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  GraduationCap, Users, Briefcase, ClipboardCheck,
  UserPlus, FileText, CalendarOff, Megaphone,
  AlertTriangle, TrendingUp, Calendar,
} from "lucide-react";

export const metadata: Metadata = { title: "Principal Dashboard" };

const EXAM_TYPE_LABELS: Record<string, string> = {
  MID_TERM: "Mid Term", FINAL: "Final", QUIZ: "Quiz",
  ASSIGNMENT: "Assignment", PRACTICAL: "Practical",
};

export default async function PrincipalDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PRINCIPAL") redirect("/login");

  const stats = await getPrincipalStats();

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold font-display">Principal Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {session.user.schoolName} — Complete Overview
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.totalStudents, sub: `${stats.activeStudents} active`, icon: GraduationCap, color: "bg-blue-500", href: "/dashboard/students" },
          { label: "Teachers", value: stats.totalTeachers, sub: "active staff", icon: Users, color: "bg-emerald-500", href: "/dashboard/teachers" },
          { label: "Employees", value: stats.totalEmployees, sub: "support staff", icon: Briefcase, color: "bg-orange-500", href: "/dashboard/employees" },
          { label: "Pending Admissions", value: stats.pendingAdmissions, sub: "need review", icon: UserPlus, color: "bg-violet-500", href: "/dashboard/admissions" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color} mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold font-display">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Attendance + Fee Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Student Attendance Today</p>
          </div>
          <p className={`text-3xl font-bold font-display ${stats.studentAttendanceRate >= 75 ? "text-emerald-600" : "text-red-600"}`}>
            {stats.studentAttendanceRate}%
          </p>
          <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${stats.studentAttendanceRate >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ width: `${stats.studentAttendanceRate}%` }}
            />
          </div>
          {stats.lowAttendanceStudents > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-xs text-red-600 font-medium">
                {stats.lowAttendanceStudents} students below 75%
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Staff Attendance Today</p>
          </div>
          <p className={`text-3xl font-bold font-display ${stats.staffAttendanceRate >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
            {stats.staffAttendanceRate}%
          </p>
          <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${stats.staffAttendanceRate >= 80 ? "bg-emerald-500" : "bg-yellow-500"}`}
              style={{ width: `${stats.staffAttendanceRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Teaching + Support Staff</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Fee Collection Rate</p>
          </div>
          <p className={`text-3xl font-bold font-display ${stats.feeCollectionRate >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
            {stats.feeCollectionRate}%
          </p>
          <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${stats.feeCollectionRate >= 80 ? "bg-emerald-500" : "bg-yellow-500"}`}
              style={{ width: `${stats.feeCollectionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{stats.unpaidFees} unpaid records</p>
        </div>
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.pendingLeaves > 0 && (
          <Link href="/dashboard/leaves?status=PENDING" className="rounded-xl border border-yellow-200 bg-yellow-500/5 p-4 flex items-center gap-3 hover:bg-yellow-500/10 transition-colors">
            <CalendarOff className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-lg font-bold font-display text-yellow-700">{stats.pendingLeaves}</p>
              <p className="text-sm text-yellow-700">Leave requests pending approval</p>
            </div>
          </Link>
        )}
        {stats.pendingAdmissions > 0 && (
          <Link href="/dashboard/admissions" className="rounded-xl border border-violet-200 bg-violet-500/5 p-4 flex items-center gap-3 hover:bg-violet-500/10 transition-colors">
            <UserPlus className="h-8 w-8 text-violet-600" />
            <div>
              <p className="text-lg font-bold font-display text-violet-700">{stats.pendingAdmissions}</p>
              <p className="text-sm text-violet-700">Admission applications pending review</p>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold font-display text-sm">Upcoming Exams</h3>
          </div>
          {stats.upcomingExams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingExams.map((exam) => (
                <Link key={exam.id} href={`/dashboard/exams/${exam.id}`}
                  className="flex items-center justify-between rounded-lg p-2.5 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{exam.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.class.displayName} · {EXAM_TYPE_LABELS[exam.type]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{formatDate(exam.startDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">Recent Announcements</h3>
            </div>
            <Link href="/dashboard/announcements/new" className="text-xs text-primary hover:underline">
              + New
            </Link>
          </div>
          {stats.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
          ) : (
            <div className="space-y-2">
              {stats.recentAnnouncements.map((a) => (
                <div key={a.id} className="rounded-lg p-2.5 hover:bg-accent transition-colors">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}