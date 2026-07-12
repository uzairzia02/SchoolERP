import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getChildGrades } from "@/features/parents/actions/parent-child.actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Child Results" };

const EXAM_TYPE_LABELS: Record<string, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

function gradeBadgeColor(grade: string) {
  if (["A+", "A", "A-"].includes(grade)) return "bg-emerald-500/10 text-emerald-700";
  if (["B+", "B", "B-"].includes(grade)) return "bg-blue-500/10 text-blue-700";
  if (["C+", "C", "C-"].includes(grade)) return "bg-amber-500/10 text-amber-700";
  return "bg-red-500/10 text-red-700";
}

export default async function ChildGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const { id } = await params;
  const data = await getChildGrades(id);

  if (!data) notFound();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.studentName}&apos;s Results</h1>
        <p className="text-sm text-muted-foreground">
          {data.className} - {data.sectionName}
        </p>
      </div>

      {data.examReports.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No results published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {data.examReports.map((exam, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">{exam.examName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {EXAM_TYPE_LABELS[exam.examType] ?? exam.examType} • {formatDate(exam.examDate)}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {exam.totalObtained}/{exam.totalMax}
                </p>
              </div>

              <div className="space-y-2">
                {exam.subjects.map((s, j) => (
                  <div key={j} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="text-sm font-medium">{s.subject}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {s.marksObt}/{s.totalMarks}
                      </span>
                      <Badge className={`${gradeBadgeColor(s.grade)} border-0 font-normal`}>
                        {s.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
