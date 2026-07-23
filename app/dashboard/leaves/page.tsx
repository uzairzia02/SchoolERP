import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyLeaves } from "@/features/leaves/actions/leave.actions";
import { ApplyLeaveForm } from "@/features/leaves/components/apply-leave-form";
import { Badge } from "@/components/ui/badge";
import { CalendarOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaves" };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700",
  APPROVED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-red-500/10 text-red-700",
  CANCELLED: "bg-gray-500/10 text-gray-700",
};

const TYPE_LABELS: Record<string, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  ANNUAL: "Annual",
  MATERNITY: "Maternity",
  PATERNITY: "Paternity",
  UNPAID: "Unpaid",
};

export default async function LeavesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 🔥 FIX: SUPER_ADMIN + ADMIN add karo + redirect to /login instead of /dashboard
  if (!["TEACHER", "FACULTY", "ACCOUNTANT", "HR", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const leaves = await getMyLeaves();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CalendarOff className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">My Leaves</h1>
            <p className="text-sm text-muted-foreground">
              View and apply for leave
            </p>
          </div>
        </div>
        <ApplyLeaveForm />
      </div>

      {leaves.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <CalendarOff className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No leave applications yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Apply for leave using the button above
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Days</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">{TYPE_LABELS[leave.type] ?? leave.type}</td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="px-4 py-3">{leave.totalDays}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-muted-foreground">
                      {leave.reason}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${STATUS_COLORS[leave.status] ?? ""} border-0 font-normal`}>
                        {leave.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}