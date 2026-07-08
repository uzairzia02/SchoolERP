import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Calendar } from "lucide-react";

const EXAM_TYPE_LABELS: Record<string, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

interface StudentExam {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  passingMarks: number;
  attachments: string[];
  subjects: { name: string; code: string; totalMarks: number; date: Date | null }[];
}

export function StudentExamList({ exams }: { exams: StudentExam[] }) {
  if (exams.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        No exams scheduled yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const isUpcoming = new Date(exam.startDate) >= new Date();
        return (
          <div key={exam.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold">{exam.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                </p>
              </div>
              <Badge
                className={
                  isUpcoming
                    ? "bg-blue-500/10 text-blue-700 border-0 font-normal"
                    : "bg-gray-500/10 text-gray-700 border-0 font-normal"
                }
              >
                {isUpcoming ? "Upcoming" : "Completed"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="font-normal">
                {EXAM_TYPE_LABELS[exam.type] ?? exam.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Total: {exam.totalMarks} • Passing: {exam.passingMarks}
              </span>
            </div>

            {exam.subjects.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t">
                {exam.subjects.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{s.name} <span className="text-muted-foreground text-xs">({s.code})</span></span>
                    <span className="text-muted-foreground text-xs">
                      {s.date ? formatDate(s.date) : "TBA"} • {s.totalMarks} marks
                    </span>
                  </div>
                ))}
              </div>
            )}

            {exam.attachments.length > 0 && (
              <div className="pt-3 mt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" /> Attachments
                </p>
                <div className="flex flex-wrap gap-2">
                  {exam.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-md border bg-muted/50 hover:bg-muted transition-colors truncate max-w-[200px]"
                    >
                      {url.split("/").pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
