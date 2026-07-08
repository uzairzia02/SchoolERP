"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, GraduationCap } from "lucide-react";

import {
  enrollStudentSchema,
  type EnrollStudentInput,
} from "@/features/admissions/schemas/admission.schema";
import { enrollStudentAction } from "@/features/admissions/actions/admission.actions";
import type { AdmissionDetail } from "@/features/admissions/actions/admission.actions";
import {
  getClassesForSelect,
  getSectionsForSelect,
} from "@/features/students/actions/student.actions";
import { getFeeTypes } from "@/features/fees/actions/fee.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";

type ClassOption = { id: string; name: string; displayName: string };
type SectionOption = { id: string; name: string };
type FeeTypeOption = { id: string; name: string; amount: number; isRecurring: boolean };

interface EnrollFormProps {
  admission: AdmissionDetail;
}

export function EnrollForm({ admission }: EnrollFormProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EnrollStudentInput>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: {
      admissionId: admission.id,
      admissionDate: new Date().toISOString().split("T")[0],
      feeSetup: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "feeSetup",
  });

  const selectedClassId = watch("classId");

  useEffect(() => {
    getClassesForSelect().then(setClasses);
    getFeeTypes().then(setFeeTypes);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      getSectionsForSelect(selectedClassId).then(setSections);
    } else {
      setSections([]);
    }
  }, [selectedClassId]);

  function addFeeType() {
    append({
      feeTypeId: "",
      amount: 0,
      dueDate: new Date().toISOString().split("T")[0],
      isMonthly: false,
      monthsCount: 1,
      discount: 0,
    });
  }

  function onFeeTypeSelect(index: number, feeTypeId: string) {
    const feeType = feeTypes.find((f) => f.id === feeTypeId);
    if (feeType) {
      // Auto-fill amount and set recurring
      const form = document.querySelector(
        `input[name="feeSetup.${index}.amount"]`
      ) as HTMLInputElement;
      if (form) form.value = String(feeType.amount);

      const monthlyCheck = document.querySelector(
        `input[name="feeSetup.${index}.isMonthly"]`
      ) as HTMLInputElement;
      if (monthlyCheck) monthlyCheck.checked = feeType.isRecurring;
    }
  }

  async function onSubmit(values: EnrollStudentInput) {
    const result = await enrollStudentAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof EnrollStudentInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Student enrolled successfully!");
    router.push(`/dashboard/students`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("admissionId")} />

      {/* Student Preview */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display">
              {admission.firstName} {admission.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Applying for: {admission.applyingForClass}
            </p>
            <Badge className="mt-1 text-[10px]">Accepted</Badge>
          </div>
        </div>
      </div>

      {/* Enrollment Details */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold font-display">Enrollment Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admission # and Roll # will be auto-generated
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Admission Date *</Label>
            <Input
              type="date"
              {...register("admissionDate")}
              className={cn(errors.admissionDate && "border-destructive")}
            />
            {errors.admissionDate && (
              <p className="text-xs text-destructive">{errors.admissionDate.message}</p>
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
            <Label>Section</Label>
            <select
              {...register("sectionId")}
              disabled={!selectedClassId || sections.length === 0}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Select section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-generated info notice */}
        <div className="rounded-lg bg-blue-500/5 border border-blue-200 p-3">
          <p className="text-xs text-blue-700 font-medium">Auto-generated on enrollment:</p>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <div className="text-xs text-blue-600">
              📋 Admission Number: <span className="font-mono font-bold">{new Date().getFullYear()}-XXXX</span>
            </div>
            <div className="text-xs text-blue-600">
              🔢 Roll Number: <span className="font-mono font-bold">Auto (unique per class)</span>
            </div>
            <div className="text-xs text-blue-600">
              🔐 Student Login: <span className="font-mono font-bold">admission#@student.school.com</span>
            </div>
            <div className="text-xs text-blue-600">
              🔑 Default Password: <span className="font-mono font-bold">Student@123</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Setup */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display">Fee Assignment</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign fees at enrollment — one-time and recurring monthly
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addFeeType}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Fee
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No fees added yet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click "Add Fee" to assign fees at enrollment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const isMonthly = watch(`feeSetup.${index}.isMonthly`);
              const amount = watch(`feeSetup.${index}.amount`) ?? 0;
              const months = watch(`feeSetup.${index}.monthsCount`) ?? 1;
              const discount = watch(`feeSetup.${index}.discount`) ?? 0;
              const total = isMonthly
                ? (Number(amount) - Number(discount)) * Number(months)
                : Number(amount) - Number(discount);

              return (
                <div
                  key={field.id}
                  className="rounded-xl border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fee #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      {total > 0 && (
                        <span className="text-xs font-bold text-primary">
                          Total: {formatCurrency(total)}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fee Type *</Label>
                      <select
                        {...register(`feeSetup.${index}.feeTypeId`)}
                        onChange={(e) => onFeeTypeSelect(index, e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select fee type</option>
                        {feeTypes.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Amount (PKR) *</Label>
                      <Input
                        type="number"
                        className="h-9 text-sm"
                        {...register(`feeSetup.${index}.amount`)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Due Date *</Label>
                      <Input
                        type="date"
                        className="h-9 text-sm"
                        {...register(`feeSetup.${index}.dueDate`)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Discount (PKR)</Label>
                      <Input
                        type="number"
                        className="h-9 text-sm"
                        placeholder="0"
                        {...register(`feeSetup.${index}.discount`)}
                      />
                    </div>
                  </div>

                  {/* Monthly Toggle */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register(`feeSetup.${index}.isMonthly`)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm">Monthly recurring fee</span>
                    </label>

                    {isMonthly && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          Months:
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          className="h-8 w-20 text-sm"
                          {...register(`feeSetup.${index}.monthsCount`)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/admissions/${admission.id}`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GraduationCap className="h-4 w-4" />
          )}
          Enroll Student
        </Button>
      </div>
    </form>
  );
}