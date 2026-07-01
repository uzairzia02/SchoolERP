"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

import { sectionSchema, type SectionInput } from "@/features/classes/schemas/class.schema";
import { createSectionAction } from "@/features/classes/actions/class.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SectionFormDialogProps {
  classId: string;
}

export function SectionFormDialog({ classId }: SectionFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { classId, capacity: 40 },
  });

  async function onSubmit(values: SectionInput) {
    const result = await createSectionAction({ ...values, classId });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Section created.");
    reset({ classId, name: "", capacity: 40 });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Section
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-display">Add Section</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("classId")} value={classId} />

          <div className="space-y-1.5">
            <Label>Section Name *</Label>
            <Input
              placeholder="e.g. A, B, Red, Blue"
              disabled={isSubmitting}
              autoFocus
              {...register("name")}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              placeholder="40"
              disabled={isSubmitting}
              {...register("capacity")}
              className={cn(errors.capacity && "border-destructive")}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
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
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Add Section
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}