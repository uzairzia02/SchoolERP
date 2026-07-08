import { getAssignmentById } from "../actions/assignment.actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SubmissionForm } from "./submission-form";
import { Calendar, BookOpen, Paperclip, CheckCircle2 } from "lucide-react";

export async function StudentAssignmentDetail({ id }: { id: string }) {
  const assignment = await getAssignmentById(id);

  if (!assignment || !("mySubmission" in assignment)) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        Assignment not found.
      </div>
    );
  }

  const isPastDue = new Date() > new Date(assignment.dueDate);
  const isGraded = assignment.mySubmission?.marksObt != null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {assignment.subject} • {assignment.teacherName}
            </p>
          </div>
          {assignment.mySubmission ? (
            <Badge className="bg-emerald-500/10 text-emerald-700 border-0">
              {isGraded ? "Graded" : "Submitted"}
            </Badge>
          ) : (
            <Badge className={isPastDue ? "bg-red-500/10 text-red-700 border-0" : "bg-amber-500/10 text-amber-700 border-0"}>
              {isPastDue ? "Overdue" : "Pending"}
            </Badge>
          )}
        </div>

        {assignment.description && (
          <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{assignment.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <InfoStat icon={<Calendar className="h-4 w-4 text-blue-600" />} label="Due Date" value={formatDate(assignment.dueDate)} />
          <InfoStat icon={<BookOpen className="h-4 w-4 text-purple-600" />} label="Total Marks" value={assignment.totalMarks ?? "N/A"} />
        </div>

        {assignment.attachments.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" /> Attachments from teacher
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

      {isGraded && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Your Grade
          </h2>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-sm font-medium">
              {assignment.mySubmission!.marksObt}/{assignment.totalMarks ?? "?"}
            </Badge>
          </div>
          {assignment.mySubmission!.feedback && (
            <p className="text-sm text-muted-foreground italic">
              &ldquo;{assignment.mySubmission!.feedback}&rdquo;
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">
          {assignment.mySubmission ? "Your Submission" : "Submit Your Work"}
        </h2>
        <SubmissionForm
          assignmentId={assignment.id}
          existing={assignment.mySubmission}
          isPastDue={isPastDue}
        />
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
