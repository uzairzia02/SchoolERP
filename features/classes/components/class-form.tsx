"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { classSchema, type ClassInput } from "@/features/classes/schemas/class.schema";
import { createClassAction, updateClassAction } from "@/features/classes/actions/class.actions";
import type { ClassDetail } from "@/features/classes/actions/class.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ClassFormProps {
  classData?: ClassDetail;
}

export function ClassForm({ classData }: ClassFormProps) {
  const router = useRouter();
  const isEdit = !!classData;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: classData
      ? {
          name: classData.name,
          displayName: classData.displayName,
          order: classData.order,
        }
      : { order: 0 },
  });

  async function onSubmit(values: ClassInput) {
    const result = isEdit
      ? await updateClassAction({ ...values, id: classData.id })
      : await createClassAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof ClassInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Saved successfully.");
    router.push("/dashboard/classes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Class Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. 1, 6, 10, KG"
            disabled={isSubmitting}
            {...register("name")}
            className={cn(errors.name && "border-destructive")}
          />
          <p className="text-xs text-muted-foreground">
            Short identifier used internally (e.g. "1", "10", "KG")
          </p>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayName">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="displayName"
            placeholder="e.g. Class 1, Grade 10, Kindergarten"
            disabled={isSubmitting}
            {...register("displayName")}
            className={cn(errors.displayName && "border-destructive")}
          />
          <p className="text-xs text-muted-foreground">
            Full name shown throughout the app
          </p>
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            placeholder="0"
            disabled={isSubmitting}
            {...register("order")}
            className={cn(errors.order && "border-destructive")}
          />
          <p className="text-xs text-muted-foreground">
            Controls sort order in lists (lower numbers appear first)
          </p>
          {errors.order && (
            <p className="text-xs text-destructive">{errors.order.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/classes")}
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
          {isEdit ? "Save Changes" : "Create Class"}
        </Button>
      </div>
    </form>
  );
}