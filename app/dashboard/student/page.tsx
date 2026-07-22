import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentStats } from "@/features/dashboard/shared/actions/student.actions";
import { formatDate, formatRelative, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GraduationCap, ClipboardCheck, BookOpen, Wallet, Clock,
  Megaphone, CheckCircle, FileText,
} from "lucide-react";

export const metadata: Metadata = { title: "Student Dashboard" };

const EXAM_TYPE_LABELS: Record<string, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

const FEE_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-500/10 text-red-700",
  PARTIAL: "bg-amber-500/10 text-amber-700",
  OVERDUE: "bg-red-600/10 text-red-800",
};

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  const stats = await getStudentStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const {
    studentName, className, sectionName, attendancePercentage,
    todayClasses, upcomingExams, pendingAssignments, recentGrades,
    pendingFees, totalOutstandingFees, recentAnnouncements,
  } = stats;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {studentName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {className} - {sectionName} • {formatDate(new Date())}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/student/attendance">
  <StatCard
    icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
    label="My Attendance"
    value={`${attendancePercentage}%`}
    iconBg="bg-emerald-500/10"
  />
</Link>
        <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} label="Pending Assignments" value={pendingAssignments.length} iconBg="bg-blue-500/10" />
        <StatCard icon={<BookOpen className="h-5 w-5 text-purple-600" />} label="Upcoming Exams" value={upcomingExams.length} iconBg="bg-purple-500/10" />
        <StatCard icon={<Wallet className="h-5 w-5 text-red-600" />} label="Outstanding Fees" value={formatCurrency(totalOutstandingFees)} iconBg="bg-red-500/10" />
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
              <Link href="/dashboard/student/timetable">View Timetable</Link>
            </Button>
          </div>

          {todayClasses.length === 0 ? (
            <EmptyState icon={<Clock className="h-8 w-8" />} text="No classes scheduled for today" />
          ) : (
            <div className="space-y-2">
              {todayClasses.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">{c.teacher} • Room {c.room}</p>
                  </div>
                  <Badge variant="outline" className="font-normal">{c.time}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Pending Assignments
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/student/assignments">View All</Link>
            </Button>
          </div>

          {pendingAssignments.length === 0 ? (
            <EmptyState icon={<CheckCircle className="h-8 w-8" />} text="All caught up!" />
          ) : (
            <div className="space-y-3">
              {pendingAssignments.slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">Due {formatDate(a.dueDate)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Grades */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Recent Grades
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/student/grades">View All</Link>
            </Button>
          </div>

          {recentGrades.length === 0 ? (
            <EmptyState icon={<BookOpen className="h-8 w-8" />} text="No grades recorded yet" />
          ) : (
            <div className="space-y-2">
              {recentGrades.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{g.subject}</p>
                    <p className="text-xs text-muted-foreground">{g.examName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{g.marksObt}/{g.totalMarks}</p>
                    <Badge variant="secondary" className="font-normal">{g.grade}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              Upcoming Exams
            </h2>
          </div>

          {upcomingExams.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="h-8 w-8" />} text="No upcoming exams" />
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((e: any) => (
                <div key={e.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <Badge variant="secondary" className="font-normal">{EXAM_TYPE_LABELS[e.type] ?? e.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{formatDate(e.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Fees */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Pending Fees
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/student/fees">View All</Link>
            </Button>
          </div>

          {pendingFees.length === 0 ? (
            <EmptyState icon={<CheckCircle className="h-8 w-8" />} text="No pending fees" />
          ) : (
            <div className="space-y-3">
              {pendingFees.map((f: any) => (
                <div key={f.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{f.feeType}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(f.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(f.amount)}</p>
                    <Badge className={`${FEE_STATUS_COLORS[f.status] ?? ""} border-0 font-normal`}>
                      {f.status}
                    </Badge>
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
              <Link href="/dashboard/student/announcements">View All</Link>
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
