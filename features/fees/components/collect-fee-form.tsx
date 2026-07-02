"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X, CheckCircle } from "lucide-react";

import { collectFeeSchema, type CollectFeeInput } from "@/features/fees/schemas/fee.schema";
import { collectFeeAction } from "@/features/fees/actions/fee.actions";
import type { FeeListItem } from "@/features/fees/actions/fee.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CollectFeeFormProps {
  fee: FeeListItem;
  onClose: () => void;
}

export function CollectFeeForm({ fee, onClose }: CollectFeeFormProps) {
  const router = useRouter();
  const netAmount = fee.amount - fee.discount + fee.fine;
  const remaining = netAmount - fee.paidAmount;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectFeeInput>({
    resolver: zodResolver(collectFeeSchema),
    defaultValues: {
      feeId: fee.id,
      paidAmount: remaining,
      paymentMethod: "CASH",
    },
  });

  async function onSubmit(values: CollectFeeInput) {
    const result = await collectFeeAction(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Payment collected.");
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-display">Collect Payment</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Fee Summary */}
        <div className="rounded-lg bg-muted/30 p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Student</span>
            <span className="text-sm font-medium">
              {fee.student.firstName} {fee.student.lastName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fee Type</span>
            <span className="text-sm font-medium">{fee.feeType.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-sm font-medium">{formatCurrency(fee.amount)}</span>
          </div>
          {fee.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Discount</span>
              <span className="text-sm font-medium text-emerald-600">
                -{formatCurrency(fee.discount)}
              </span>
            </div>
          )}
          {fee.fine > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fine</span>
              <span className="text-sm font-medium text-red-600">
                +{formatCurrency(fee.fine)}
              </span>
            </div>
          )}
          {fee.paidAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Already Paid</span>
              <span className="text-sm font-medium text-blue-600">
                -{formatCurrency(fee.paidAmount)}
              </span>
            </div>
          )}
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Remaining</span>
            <span className="text-sm font-bold text-primary">
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("feeId")} value={fee.id} />

          <div className="space-y-1.5">
            <Label>Amount to Collect (PKR) *</Label>
            <Input
              type="number"
              disabled={isSubmitting}
              {...register("paidAmount")}
              className={cn(errors.paidAmount && "border-destructive")}
            />
            {errors.paidAmount && (
              <p className="text-xs text-destructive">{errors.paidAmount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method *</Label>
            <select
              {...register("paymentMethod")}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input
              placeholder="Optional note..."
              disabled={isSubmitting}
              {...register("remarks")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Collect Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}