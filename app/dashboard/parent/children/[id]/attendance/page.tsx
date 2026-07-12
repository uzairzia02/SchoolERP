import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getChildAttendance } from "@/features/parents/actions/parent-child.actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";

export const metadata: Metadata = { title: "Child Attendance" };

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-500/10 text-emerald-700",
  ABSENT: "bg-red-500/10 text-red-700",
  LATE: "bg-amber-500/10 text-amber-700",
  HALF_DAY: "bg-blue-500/10 text-blue-700",
  LEAVE: "bg-gray-500/10 text-gray-700",
};

export default async function ChildAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const { id } = await params;
  const data = await getChildAttendance(id);

  if (!data) notFound();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.studentName}&apos;s Attendance</h1>
        <p className="text-sm text-muted-foreground">{data.className}</p>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center gap-3 max-w-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xl font-semibold leading-none">{data.percentage}%</p>
          <p className="text-xs text-muted-foreground mt-1">Attendance Rate</p>
        </div>
      </div>

      {data.records.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No attendance records found.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            {data.records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm">{formatDate(r.date)}</p>
                <div className="flex items-center gap-2">
                  {r.remarks && <p className="text-xs text-muted-foreground">{r.remarks}</p>}
                  <Badge className={`${STATUS_COLORS[r.status] ?? ""} border-0 font-normal`}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
