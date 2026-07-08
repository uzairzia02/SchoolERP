"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gradeSubmission } from "../actions/assignment.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, PenLine } from "lucide-react";

interface GradeSubmissionDialogProps {
  submissionId: string;
  studentName: string;
  totalMarks?: number | null;
  currentMarks?: number | null;
  currentFeedback?: string | null;
}

export function GradeSubmissionDialog({
  submissionId, studentName, totalMarks, currentMarks, currentFeedback,
}: GradeSubmissionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [marks, setMarks] = useState(currentMarks?.toString() ?? "");
  const [feedback, setFeedback] = useState(currentFeedback ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!marks) {
      toast.error("Please enter marks");
      return;
    }

    startTransition(async () => {
      const result = await gradeSubmission({
        submissionId,
        marksObt: Number(marks),
        feedback: feedback || undefined,
      });

      if (result.success) {
        toast.success("Grade saved");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save grade");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenLine className="h-3.5 w-3.5 mr-1.5" />
          {currentMarks != null ? "Edit Grade" : "Grade"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade submission — {studentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marks">
              Marks Obtained {totalMarks ? `(out of ${totalMarks})` : ""}
            </Label>
            <Input
              id="marks"
              type="number"
              min={0}
              max={totalMarks ?? undefined}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Good work, but check question 3 again..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Grade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
