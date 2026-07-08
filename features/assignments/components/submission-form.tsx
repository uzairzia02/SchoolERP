"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAssignment } from "../actions/assignment.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SubmissionFormProps {
  assignmentId: string;
  existing?: {
    content: string | null;
    attachments: string[];
  } | null;
  isPastDue: boolean;
}

export function SubmissionForm({ assignmentId, existing, isPastDue }: SubmissionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(existing?.content ?? "");
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>(
    (existing?.attachments ?? []).map((url) => ({ url, name: url.split("/").pop() ?? url }))
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim() && attachments.length === 0) {
      toast.error("Please add text content or at least one attachment");
      return;
    }

    startTransition(async () => {
      const result = await submitAssignment({
        assignmentId,
        content: content || undefined,
        attachments: attachments.map((a) => a.url),
      });

      if (result.success) {
        toast.success(existing ? "Submission updated" : "Assignment submitted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isPastDue && (
        <p className="text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
          This assignment is past its due date. Your submission will be marked as late.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="content">Your Answer</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Type your answer here..."
        />
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <FileUpload
          endpoint="assignmentAttachment"
          value={attachments}
          onChange={setAttachments}
          maxFiles={5}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {existing ? "Update Submission" : "Submit Assignment"}
      </Button>
    </form>
  );
}
