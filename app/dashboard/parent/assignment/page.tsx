import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChildrenAssignments } from "@/features/parents/actions/children-assignments.actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export const metadata: Metadata = { title: "Assignments" };

export default async function ParentAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const assignments = await getChildrenAssignments();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
        <p className="text-sm text-muted-foreground">Homework across all your children.</p>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No assignments found.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={`${a.id}-${a.childName}`} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.childName} • {a.subject} • Due {formatDate(a.dueDate)}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${
                    a.isSubmitted
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700"
                  } border-0 font-normal shrink-0`}
                >
                  {a.isSubmitted ? "Submitted" : "Pending"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}