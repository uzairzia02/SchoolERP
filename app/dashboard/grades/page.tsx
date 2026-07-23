import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTeacherExams } from "@/features/exams/actions/exam.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Pencil, Eye } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Grades" };

const EXAM_TYPE_LABELS: Record<string, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

export default async function GradesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TEACHER", "FACULTY"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const exams = await getTeacherExams();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Grades</h1>
          <p className="text-sm text-muted-foreground">
            Enter and view marks for your subjects
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No exams found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Exams for your subjects will appear here once created
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold font-display">{exam.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exam.class?.displayName}
                  </p>
                </div>
                <Badge variant={exam.isPublished ? "default" : "secondary"}>
                  {exam.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {exam.subjects.map((s) => (
                  <span
                    key={s.subject.id}
                    className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium"
                  >
                    {s.subject.name}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {formatDate(exam.startDate)} · {exam.gradesEntered} grade(s) entered
              </p>

              <Button asChild size="sm" className="w-full gap-2">
                <Link href={`/dashboard/exams/${exam.id}/grades`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Enter / View Grades
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}