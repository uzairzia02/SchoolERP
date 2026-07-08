"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, BookOpen } from "lucide-react";
import { z } from "zod";
import { createExamAction } from "@/features/exams/actions/exam.actions";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { getSubjects } from "@/features/subjects/actions/subject.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["MID_TERM", "FINAL", "QUIZ", "ASSIGNMENT", "PRACTICAL"]),
  classId: z.string().min(1, "Class is required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  totalMarks: z.coerce.number().int().min(1),
  passingMarks: z.coerce.number().int().min(1),
  // subjectIds: z.array(z.string()).min(1, "Select at least one subject"),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;
type ClassOption = { id: string; name: string; displayName: string };
type SubjectOption = { id: string; name: string; code: string };
type UploadedFile = { url: string; name: string };

const EXAM_TYPE_LABELS = {
  MID_TERM: "Mid Term",
  FINAL: "Final Exam",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

export function ExamForm() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalMarks: 100,
      passingMarks: 33,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedClassId = watch("classId");

  useEffect(() => {
    getClassesForSelect().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      getSubjects({ classId: selectedClassId, pageSize: 100 }).then((r) =>
        setSubjects(r.data.map((s) => ({ id: s.id, name: s.name, code: s.code })))
      );
      setSelectedSubjects([]);
    }
  }, [selectedClassId]);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectAllSubjects() {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map((s) => s.id));
    }
  }

  async function onSubmit(values: FormOutput) {
    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject.");
      return;
    }

    const result = await createExamAction({
      ...values,
      subjectIds: selectedSubjects,
      attachments: attachments.map((a) => a.url),
    });

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FormOutput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Exam created.");
    router.push("/dashboard/exams");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, (errors) => {
    console.log("❌ Validation failed:", errors);
  })}
  className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Exam Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Exam Name *</Label>
            <Input
              placeholder="e.g. Mid Term Examination 2026"
              {...register("name")}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Exam Type *</Label>
            <select
              {...register("type")}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                errors.type && "border-destructive"
              )}
            >
              <option value="">Select type</option>
              {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Class *</Label>
            <select
              {...register("classId")}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                errors.classId && "border-destructive"
              )}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="text-xs text-destructive">{errors.classId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Start Date *</Label>
            <Input type="date" {...register("startDate")} />
          </div>

          <div className="space-y-1.5">
            <Label>End Date *</Label>
            <Input type="date" {...register("endDate")} />
          </div>

          <div className="space-y-1.5">
            <Label>Total Marks *</Label>
            <Input
              type="number"
              {...register("totalMarks")}
              className={cn(errors.totalMarks && "border-destructive")}
            />
            {errors.totalMarks && (
              <p className="text-xs text-destructive">{errors.totalMarks.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Passing Marks *</Label>
            <Input
              type="number"
              {...register("passingMarks")}
              className={cn(errors.passingMarks && "border-destructive")}
            />
            {errors.passingMarks && (
              <p className="text-xs text-destructive">{errors.passingMarks.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display">Subjects</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select subjects included in this exam
            </p>
          </div>
          {subjects.length > 0 && (
            <button
              type="button"
              onClick={selectAllSubjects}
              className="text-xs text-primary hover:underline"
            >
              {selectedSubjects.length === subjects.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>

        {!selectedClassId ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a class first to see available subjects
          </p>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No subjects found for this class
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => toggleSubject(subject.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors",
                  selectedSubjects.includes(subject.id)
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "hover:bg-accent"
                )}
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate">{subject.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {subject.code}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attachments */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold font-display">Attachments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload exam papers, seating plans, or instructions (optional)
          </p>
        </div>

        <FileUpload
          endpoint="examAttachment"
          value={attachments}
          onChange={setAttachments}
          maxFiles={5}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/exams")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Create Exam
        </Button>
      </div>
    </form>
  );
}
