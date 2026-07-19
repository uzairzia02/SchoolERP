"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import {
  subjectSchema,
  type SubjectInput,
} from "@/features/subjects/schemas/subject.schema";
import {
  createSubjectAction,
  updateSubjectAction,
} from "@/features/subjects/actions/subject.actions";
import type { SubjectDetail } from "@/features/subjects/actions/subject.actions";
// import { getClassesForSelect } from "@/features/students/actions/student.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SubjectFormProps {
  subject?: SubjectDetail;
}

// type ClassOption = { id: string; name: string; displayName: string };

export function SubjectForm({ subject }: SubjectFormProps) {
  const router = useRouter();
  const isEdit = !!subject;
  // const [classes, setClasses] = useState<ClassOption[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
    name: subject?.name ?? "",
    code: subject?.code ?? "",
    description: subject?.description ?? "",
    creditHours: subject?.creditHours ?? 1,
  },
  });

  // useEffect(() => {
  //   getClassesForSelect().then(setClasses);
  // }, []);

  async function onSubmit(values: SubjectInput) {
    const result = isEdit
      ? await updateSubjectAction({ ...values, id: subject.id })
      : await createSubjectAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SubjectInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Saved successfully.");
    router.push("/dashboard/subjects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Subject Information</h3>

        <div className="space-y-1.5">
          <Label htmlFor="name">
            Subject Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. Mathematics, English Literature"
            disabled={isSubmitting}
            {...register("name")}
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code">
            Subject Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            placeholder="e.g. MATH, ENG, PHY"
            disabled={isSubmitting}
            {...register("code")}
            className={cn(errors.code && "border-destructive")}
          />
          <p className="text-xs text-muted-foreground">
            Auto-converted to uppercase. Used as short identifier.
          </p>
          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </div>

        {/* <div className="space-y-1.5">
          <Label htmlFor="classId">Class (Optional)</Label>
          <select
            id="classId"
            {...register("classId")}
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="">All Classes (General Subject)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Leave empty if this subject is taught across multiple classes.
          </p>
        </div> */}

        <div className="space-y-1.5">
          <Label htmlFor="creditHours">Credit Hours</Label>
          <Input
            id="creditHours"
            type="number"
            min={1}
            max={10}
            placeholder="1"
            disabled={isSubmitting}
            {...register("creditHours", {
              valueAsNumber: true,
            })}
            className={cn(errors.creditHours && "border-destructive")}
          />
          {errors.creditHours && (
            <p className="text-xs text-destructive">{errors.creditHours.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (Optional)</Label>
          <textarea
            id="description"
            placeholder="Brief description of the subject..."
            disabled={isSubmitting}
            rows={3}
            {...register("description")}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/subjects")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Save Changes" : "Create Subject"}
        </Button>
      </div>
    </form>
  );
}