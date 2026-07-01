"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserX, UserCheck, X } from "lucide-react";

import { teacherStatusSchema, type TeacherStatusInput } from "@/features/teachers/schemas/teacher.schema";
import { updateTeacherStatusAction } from "@/features/teachers/actions/teacher.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TeacherStatusDialogProps {
  teacherId: string;
  teacherName: string;
  isActive: boolean;
}

export function TeacherStatusDialog({
  teacherId,
  teacherName,
  isActive,
}: TeacherStatusDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeacherStatusInput>({
    resolver: zodResolver(teacherStatusSchema),
    defaultValues: {
      id: teacherId,
      isActive: !isActive, // toggle target state
      lastWorkingDate: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(values: TeacherStatusInput) {
    const result = await updateTeacherStatusAction(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return isActive ? (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <UserX className="h-4 w-4" />
        Mark Inactive
      </Button>
    ) : (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <UserCheck className="h-4 w-4" />
        Mark Active
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-display">
            {isActive ? "Mark Teacher Inactive" : "Mark Teacher Active"}
          </h3>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {isActive
            ? `${teacherName} will be marked as inactive. Their record stays in the system.`
            : `${teacherName} will be marked as active again.`}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} value={teacherId} />
          <input type="hidden" {...register("isActive")} value={String(!isActive)} />

          {isActive && (
            <>
              <div className="space-y-1.5">
                <Label>Last Working Date *</Label>
                <Input
                  type="date"
                  disabled={isSubmitting}
                  {...register("lastWorkingDate")}
                  className={cn(errors.lastWorkingDate && "border-destructive")}
                />
                {errors.lastWorkingDate && (
                  <p className="text-xs text-destructive">{errors.lastWorkingDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Reason for Leaving</Label>
                <textarea
                  placeholder="e.g. Resigned, Contract ended, Terminated..."
                  disabled={isSubmitting}
                  {...register("leavingReason")}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}