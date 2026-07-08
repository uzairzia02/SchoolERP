import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentGrades } from "@/features/grades/actions/student-grades.actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "My Results" };

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

export default async function StudentResultsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  const data = await getStudentGrades();

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Unable to load results</p>
        </div>
      </div>
    );
  }

  const { studentName, className, sectionName, overallAverage, totalExamsGraded, examReports } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Results</h1>
        <p className="text-sm text-muted-foreground">
          {studentName} • {className} - {sectionName}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-none">{overallAverage}%</p>
            <p className="text-xs text-muted-foreground mt-1">Overall Average</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <GraduationCap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-none">{totalExamsGraded}</p>
            <p className="text-xs text-muted-foreground mt-1">Exams Graded</p>
          </div>
        </div>
      </div>

      {/* Exam Reports */}
      {examReports.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No results published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {examReports.map((exam, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">{exam.examName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {EXAM_TYPE_LABELS[exam.examType] ?? exam.examType} • {formatDate(exam.examDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {exam.totalObtained}/{exam.totalMax}
                  </p>
                  <p className="text-xs text-muted-foreground">{exam.averagePercentage}% avg</p>
                </div>
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
