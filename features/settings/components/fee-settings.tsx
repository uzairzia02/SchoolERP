"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Banknote } from "lucide-react";
import { z } from "zod";
import { updateFeeSettingsAction } from "@/features/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  passingMarks: z.coerce.number().int().min(1).max(100),
});

type FormData = z.infer<typeof schema>;

interface FeeSettingsProps {
  settings: {
    bankName: string | null;
    bankAccountNumber: string | null;
    bankBranch: string | null;
    passingMarks: number;
  };
}

export function FeeSettings({ settings }: FeeSettingsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankName: settings.bankName ?? "",
      bankAccountNumber: settings.bankAccountNumber ?? "",
      bankBranch: settings.bankBranch ?? "",
      passingMarks: settings.passingMarks,
    },
  });

  async function onSubmit(values: FormData) {
    const result = await updateFeeSettingsAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Bank Details */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold font-display">Bank Account Details</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          School's official bank account where fee payments are deposited
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Bank Name</Label>
            <Input {...register("bankName")} placeholder="HBL / MCB / UBL" />
          </div>
          <div className="space-y-1.5">
            <Label>Account Number</Label>
            <Input {...register("bankAccountNumber")} placeholder="0123456789012345" />
          </div>
          <div className="space-y-1.5">
            <Label>Branch</Label>
            <Input {...register("bankBranch")} placeholder="Main Branch, Karachi" />
          </div>
        </div>
      </div>

      {/* Passing Marks */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Examination Settings</h3>
        <div className="max-w-xs space-y-1.5">
          <Label>Default Passing Marks (%)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            {...register("passingMarks")}
            className={errors.passingMarks ? "border-destructive" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Minimum percentage required to pass (default: 33%)
          </p>
          {errors.passingMarks && (
            <p className="text-xs text-destructive">{errors.passingMarks.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}