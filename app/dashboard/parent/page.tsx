import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParentStats } from "@/features/dashboard/shared/actions/parent.actions";
import { formatDate, formatRelative, formatCurrency, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, Wallet, ClipboardCheck, BookOpen, Megaphone, Heart,
} from "lucide-react";

export const metadata: Metadata = { title: "Parent Dashboard" };

export default async function ParentDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const stats = await getParentStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { parentName, children, totalOutstandingFees, recentAnnouncements } = stats;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {parentName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(new Date())} — here&apos;s how your children are doing.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} label="Children" value={children.length} iconBg="bg-blue-500/10" />
        <StatCard icon={<Wallet className="h-5 w-5 text-red-600" />} label="Total Outstanding Fees" value={formatCurrency(totalOutstandingFees)} iconBg="bg-red-500/10" />
      </div>

      {/* Children Cards */}
      {children.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          No children linked to this account yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child: any) => (
            <div key={child.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-700">
                  {getInitials(child.name)}
                </div>
                <div>
                  <p className="font-medium">{child.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {child.className} - {child.sectionName} • {child.relation}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat icon={<ClipboardCheck className="h-4 w-4 text-emerald-600" />} label="Attendance" value={`${child.attendancePercentage}%`} />
                <MiniStat icon={<BookOpen className="h-4 w-4 text-purple-600" />} label="Exams Soon" value={child.upcomingExamCount} />
                <MiniStat icon={<Wallet className="h-4 w-4 text-red-600" />} label="Due Fees" value={formatCurrency(child.outstandingFees)} />
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/dashboard/parent/children/${child.id}/grades`}>Grades</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/dashboard/parent/children/${child.id}/fees`}>Fees</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/dashboard/parent/children/${child.id}/attendance`}>Attendance</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Announcements */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            Recent Announcements
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/parent/announcements">View All</Link>
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

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-sm font-semibold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
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
