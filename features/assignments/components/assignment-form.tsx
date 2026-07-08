"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssignment, updateAssignment, getAssignmentFormOptions } from "../actions/assignment.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AssignmentFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    subjectId: string;
    classId: string;
    dueDate: Date | string;
    totalMarks?: number | null;
    attachments: string[];
  };
}

export function AssignmentForm({ mode, initialData }: AssignmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [options, setOptions] = useState<{
    classes: { id: string; name: string }[];
    subjects: { id: string; name: string; classId: string | null }[];
  }>({ classes: [], subjects: [] });

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [classId, setClassId] = useState(initialData?.classId ?? "");
  const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().slice(0, 16)
      : ""
  );
  const [totalMarks, setTotalMarks] = useState(initialData?.totalMarks?.toString() ?? "");
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>(
    (initialData?.attachments ?? []).map((url) => ({ url, name: url.split("/").pop() ?? url }))
  );

  useEffect(() => {
    getAssignmentFormOptions().then(setOptions);
  }, []);

  const filteredSubjects = classId
    ? options.subjects.filter((s) => s.classId === classId)
    : options.subjects;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !classId || !subjectId || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const payload = {
        title,
        description: description || undefined,
        classId,
        subjectId,
        dueDate: new Date(dueDate),
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
        attachments: attachments.map((a) => a.url),
      };

      const result =
        mode === "create"
          ? await createAssignment(payload)
          : await updateAssignment({ id: initialData!.id, ...payload });

      if (result.success) {
        toast.success(mode === "create" ? "Assignment created" : "Assignment updated");
        router.push("/dashboard/assignments");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 4 Exercise Sheet"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Instructions for students..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Class *</Label>
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {options.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Subject *</Label>
          <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalMarks">Total Marks</Label>
          <Input
            id="totalMarks"
            type="number"
            min={1}
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            placeholder="e.g. 20"
          />
        </div>
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Assignment" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
