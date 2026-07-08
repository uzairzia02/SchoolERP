import { getAssignmentById } from "../actions/assignment.actions";
import { formatDate, formatRelative, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GradeSubmissionDialog } from "./grade-submission-dialog";
import { FileText, Calendar, BookOpen, Users, Paperclip, CheckCircle2 } from "lucide-react";

export async function AssignmentDetail({ id }: { id: string }) {
  const assignment = await getAssignmentById(id);

  if (!assignment || !("submissions" in assignment)) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        Assignment not found.
      </div>
    );
  }

  const gradedCount = assignment.submissions.filter((s) => s.marksObt != null).length;
  const submissionRate = assignment.totalStudentsInClass > 0
    ? Math.round((assignment.submissions.length / assignment.totalStudentsInClass) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {assignment.subject} • {assignment.className} • by {assignment.teacherName}
            </p>
          </div>
          <Badge className={assignment.isActive ? "bg-emerald-500/10 text-emerald-700 border-0" : "bg-gray-500/10 text-gray-700 border-0"}>
            {assignment.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {assignment.description && (
          <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{assignment.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          <InfoStat icon={<Calendar className="h-4 w-4 text-blue-600" />} label="Due Date" value={formatDate(assignment.dueDate)} />
          <InfoStat icon={<BookOpen className="h-4 w-4 text-purple-600" />} label="Total Marks" value={assignment.totalMarks ?? "N/A"} />
          <InfoStat icon={<Users className="h-4 w-4 text-teal-600" />} label="Submissions" value={`${assignment.submissions.length}/${assignment.totalStudentsInClass}`} />
          <InfoStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Graded" value={gradedCount} />
        </div>

        {assignment.attachments.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" /> Attachments
            </p>
            <div className="flex flex-wrap gap-2">
              {assignment.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded-md border bg-muted/50 hover:bg-muted transition-colors truncate max-w-[200px]"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submission Progress */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Submission Rate</h2>
          <span className="text-sm text-muted-foreground">{submissionRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${submissionRate}%` }}
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Submissions ({assignment.submissions.length})
        </h2>

        {assignment.submissions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No submissions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {assignment.submissions.map((s) => (
              <div key={s.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-700 shrink-0">
                      {getInitials(s.studentName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.admissionNumber} • Submitted {formatRelative(s.submittedAt)}
                        {s.isLate && <span className="text-amber-600 font-medium"> • Late</span>}
                      </p>
                    </div>
                  </div>
                  <GradeSubmissionDialog
                    submissionId={s.id}
                    studentName={s.studentName}
                    totalMarks={assignment.totalMarks}
                    currentMarks={s.marksObt}
                    currentFeedback={s.feedback}
                  />
                </div>

                {s.content && (
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{s.content}</p>
                )}

                {s.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {s.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded-md border bg-muted/50 hover:bg-muted transition-colors truncate max-w-[180px]"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                )}

                {s.marksObt != null && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <Badge variant="secondary" className="font-normal">
                      {s.marksObt}/{assignment.totalMarks ?? "?"}
                    </Badge>
                    {s.feedback && <p className="text-xs text-muted-foreground italic">{s.feedback}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
