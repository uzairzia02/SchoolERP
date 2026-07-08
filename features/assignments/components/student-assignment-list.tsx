import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface StudentAssignmentRow {
  id: string;
  title: string;
  subject: string;
  dueDate: Date | string;
  totalMarks: number | null;
  mySubmission: { id: string; marksObt: number | null } | null;
}

export function StudentAssignmentList({ data }: { data: StudentAssignmentRow[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        No assignments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((a) => {
        const isPastDue = new Date() > new Date(a.dueDate);
        const status = a.mySubmission
          ? a.mySubmission.marksObt != null
            ? "graded"
            : "submitted"
          : isPastDue
          ? "overdue"
          : "pending";

        const statusConfig: Record<string, { label: string; className: string }> = {
          graded: { label: "Graded", className: "bg-emerald-500/10 text-emerald-700" },
          submitted: { label: "Submitted", className: "bg-blue-500/10 text-blue-700" },
          overdue: { label: "Overdue", className: "bg-red-500/10 text-red-700" },
          pending: { label: "Pending", className: "bg-amber-500/10 text-amber-700" },
        };

        return (
          <Link
            key={a.id}
            href={`/dashboard/student/assignments/${a.id}`}
            className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.subject} • Due {formatDate(a.dueDate)}
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <Badge className={`${statusConfig[status].className} border-0 font-normal`}>
                {statusConfig[status].label}
              </Badge>
              {a.mySubmission?.marksObt != null && (
                <span className="text-xs text-muted-foreground">
                  {a.mySubmission.marksObt}/{a.totalMarks ?? "?"}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
