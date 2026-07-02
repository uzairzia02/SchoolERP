"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X, DollarSign } from "lucide-react";

import {
  processPayrollSchema,
  type ProcessPayrollInput,
} from "@/features/payroll/schemas/payroll.schema";
import { processPayrollAction } from "@/features/payroll/actions/payroll.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, cn } from "@/lib/utils";

interface ProcessPayrollFormProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    salary: number | null;
  };
  month: number;
  year: number;
  onClose: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ProcessPayrollForm({
  employee,
  month,
  year,
  onClose,
}: ProcessPayrollFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProcessPayrollInput>({
    resolver: zodResolver(processPayrollSchema),
    defaultValues: {
      employeeId: employee.id,
      month,
      year,
      basicSalary: employee.salary ?? 0,
      allowances: 0,
      deductions: 0,
      paymentMethod: "CASH",
    },
  });

  const basicSalary = watch("basicSalary") ?? 0;
  const allowances = watch("allowances") ?? 0;
  const deductions = watch("deductions") ?? 0;
  const netSalary = Number(basicSalary) + Number(allowances) - Number(deductions);

  async function onSubmit(values: ProcessPayrollInput) {
    const result = await processPayrollAction(values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Payroll processed.");
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-display">Process Payroll</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Employee Info */}
        <div className="rounded-lg bg-muted/30 p-3 mb-4">
          <p className="text-sm font-medium">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{employee.employeeId}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {MONTHS[month - 1]} {year}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("employeeId")} />
          <input type="hidden" {...register("month")} />
          <input type="hidden" {...register("year")} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Basic Salary *</Label>
              <Input
                type="number"
                disabled={isSubmitting}
                {...register("basicSalary")}
                className={cn(errors.basicSalary && "border-destructive")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Allowances</Label>
              <Input
                type="number"
                disabled={isSubmitting}
                {...register("allowances")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deductions</Label>
              <Input
                type="number"
                disabled={isSubmitting}
                {...register("deductions")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
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
          </div>

          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input
              placeholder="Optional note..."
              disabled={isSubmitting}
              {...register("remarks")}
            />
          </div>

          {/* Net Salary Preview */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Net Salary</span>
            <span className="text-lg font-bold font-display text-primary">
              {formatCurrency(netSalary)}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              Process Payroll
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}