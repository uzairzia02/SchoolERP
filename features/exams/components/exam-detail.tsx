import type { ExamDetail } from "@/features/exams/actions/exam.actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Pencil, Globe, EyeOff, Calendar, Target } from "lucide-react";
import Link from "next/link";
import type { ExamType } from "@prisma/client";

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final Exam",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

interface ExamDetailProps {
  exam: ExamDetail;
}

export function ExamDetailView({ exam }: ExamDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">{exam.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline">{EXAM_TYPE_LABELS[exam.type]}</Badge>
                <Badge variant="outline">{exam.class.displayName}</Badge>
                <Badge variant={exam.isPublished ? "default" : "secondary"}>
                  {exam.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/exams/${exam.id}/grades`}>
                <Pencil className="h-4 w-4 mr-2" />
                Enter Grades
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Marks", value: exam.totalMarks, icon: Target, color: "bg-blue-500" },
          { label: "Passing Marks", value: exam.passingMarks, icon: Target, color: "bg-emerald-500" },
          { label: "Subjects", value: exam._count.subjects, icon: BookOpen, color: "bg-violet-500" },
          { label: "Grades Entered", value: exam._count.grades, icon: Pencil, color: "bg-orange-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mx-auto mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Exam Period */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold font-display text-sm">Exam Schedule</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(exam.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(exam.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold font-display text-sm">Subjects</h3>
        </div>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["#", "Subject", "Code", "Total Marks", "Passing Marks", "Date"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exam.subjects.map((es, i) => (
                <tr key={es.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{es.subject.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{es.subject.code}</td>
                  <td className="px-4 py-2.5">{es.totalMarks}</td>
                  <td className="px-4 py-2.5">{es.passingMarks}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {es.date ? formatDate(es.date) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}