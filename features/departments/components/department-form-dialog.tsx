"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X, Plus, Pencil } from "lucide-react";
import { z } from "zod";
import {
  createDepartmentAction,
  updateDepartmentAction,
} from "@/features/departments/actions/department.actions";
import type { DepartmentListItem } from "@/features/departments/actions/department.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface DepartmentFormDialogProps {
  department?: DepartmentListItem;
  trigger?: React.ReactNode;
}

export function DepartmentFormDialog({
  department,
  trigger,
}: DepartmentFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!department;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: department
      ? {
          name: department.name,
          code: department.code,
          description: department.description ?? "",
        }
      : {},
  });

  async function onSubmit(values: FormData) {
    const result = isEdit
      ? await updateDepartmentAction({ ...values, id: department.id })
      : await createDepartmentAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FormData, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Saved.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Department
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card border shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold font-display">
                {isEdit ? "Edit Department" : "New Department"}
              </h3>
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Department Name *</Label>
                <Input
                  placeholder="e.g. Mathematics, Human Resources"
                  autoFocus
                  {...register("name")}
                  className={cn(errors.name && "border-destructive")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Department Code *</Label>
                <Input
                  placeholder="e.g. MATH, HR, FIN"
                  {...register("code")}
                  className={cn(errors.code && "border-destructive")}
                  style={{ textTransform: "uppercase" }}
                />
                <p className="text-xs text-muted-foreground">
                  Short unique identifier (auto uppercase)
                </p>
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea
                  {...register("description")}
                  placeholder="Brief description of this department..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isEdit ? "Save Changes" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}