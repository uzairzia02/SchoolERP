"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X, Plus } from "lucide-react";

import { feeTypeSchema, type FeeTypeInput } from "@/features/fees/schemas/fee.schema";
import { createFeeTypeAction, updateFeeTypeAction } from "@/features/fees/actions/fee.actions";
import type { FeeTypeItem } from "@/features/fees/actions/fee.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FeeTypeFormProps {
  feeType?: FeeTypeItem;
  onSuccess?: () => void;
}

export function FeeTypeForm({ feeType, onSuccess }: FeeTypeFormProps) {
  const router = useRouter();
  const isEdit = !!feeType;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FeeTypeInput>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: feeType
      ? {
          name: feeType.name,
          description: feeType.description ?? "",
          amount: feeType.amount,
          isRecurring: feeType.isRecurring,
        }
      : { isRecurring: false },
  });

  async function onSubmit(values: FeeTypeInput) {
    const result = isEdit
      ? await updateFeeTypeAction({ ...values, id: feeType.id })
      : await createFeeTypeAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FeeTypeInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Saved.");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Fee Type Name *</Label>
        <Input
          placeholder="e.g. Tuition Fee, Library Fee"
          disabled={isSubmitting}
          {...register("name")}
          className={cn(errors.name && "border-destructive")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Default Amount (PKR) *</Label>
        <Input
          type="number"
          placeholder="5000"
          disabled={isSubmitting}
          {...register("amount")}
          className={cn(errors.amount && "border-destructive")}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea
          placeholder="Optional description..."
          disabled={isSubmitting}
          rows={2}
          {...register("description")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register("isRecurring")}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border border-input"
        />
        <span className="text-sm">Recurring fee (monthly)</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Update" : "Create"} Fee Type
        </Button>
      </div>
    </form>
  );
}