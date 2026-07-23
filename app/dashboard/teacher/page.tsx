import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTeacherStats } from "@/features/dashboard/shared/actions/dashboard.actions";
import { formatDate, formatRelative, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GraduationCap, Calendar, ClipboardCheck, FileText,
  CalendarOff, Clock, BookOpen, Megaphone, CheckCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Teacher Dashboard" };

const EXAM_TYPE_LABELS: Record<string, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700",
  APPROVED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-red-500/10 text-red-700",
  CANCELLED: "bg-gray-500/10 text-gray-700",
};

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["TEACHER", "FACULTY"].includes(session.user.role)) redirect("/login");

  const stats = await getTeacherStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">
            Unable to load dashboard data
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const {
    teacher,
    totalClasses,
    totalStudents,
    myTimetableToday: todayClasses = [],
    myLeaves: recentLeaves = [],
    pendingLeave,
    upcomingExams = [],
    myAnnouncements: recentAnnouncements = [],
    isAttendanceMarkedToday: attendanceMarkedToday = false,
  } = stats;

  const teacherName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {teacherName ?? session.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(new Date())} — here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
          label="Total Classes"
          value={totalClasses ?? 0}
          iconBg="bg-blue-500/10"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-purple-600" />}
          label="Total Students"
          value={totalStudents ?? 0}
          iconBg="bg-purple-500/10"
        />
        <StatCard
          icon={<CalendarOff className="h-5 w-5 text-amber-600" />}
          label="Pending Leave Requests"
          value={pendingLeave}
          iconBg="bg-amber-500/10"
        />
        <StatCard
          icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
          label="Attendance Today"
          value={attendanceMarkedToday ? "Marked" : "Pending"}
          iconBg="bg-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Today&apos;s Classes
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/teacher/timetable">View Timetable</Link>
            </Button>
          </div>

          {todayClasses.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              text="No classes scheduled for today"
            />
          ) : (
            <div className="space-y-2">
              {todayClasses.map((cls: any) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-xs font-semibold text-blue-700">
                      {getInitials(cls.class.displayName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cls.subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.class.displayName}
                        {cls.section?.name ? ` ${cls.section.name}` : ""}
                        {cls.room ? ` • Room ${cls.room}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-normal">
                    {cls.period.startTime}–{cls.period.endTime}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              My Recent Leaves
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/teacher/leave-requests">View All</Link>
            </Button>
          </div>

          {recentLeaves.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-8 w-8" />}
              text="No leave applications yet"
            />
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((req: any) => (
                <div key={req.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{req.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </p>
                  </div>
                  <Badge
                    className={`${LEAVE_STATUS_COLORS[req.status] ?? ""} border-0 font-normal shrink-0`}
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              Upcoming Exams
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/teacher/exams">View All</Link>
            </Button>
          </div>

          {upcomingExams.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-8 w-8" />}
              text="No upcoming exams"
            />
          ) : (
            <div className="space-y-2">
              {upcomingExams.slice(0, 5).map((exam: any) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{exam.name}</p>
                    <p className="text-xs text-muted-foreground">{exam.class.displayName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="font-normal mb-1">
                      {EXAM_TYPE_LABELS[exam.type] ?? exam.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(exam.startDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              Recent Announcements
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/teacher/announcements">View All</Link>
            </Button>
          </div>

          {recentAnnouncements.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-8 w-8" />}
              text="No recent announcements"
            />
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.slice(0, 5).map((a: any) => (
                <div key={a.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(a.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
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