"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import {
  admissionSchema,
  type AdmissionInput,
} from "@/features/admissions/schemas/admission.schema";
import { createAdmissionAction } from "@/features/admissions/actions/admission.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AdmissionForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdmissionInput>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      nationality: "Pakistani",
      parentRelation: "Father",
    },
  });

  async function onSubmit(values: AdmissionInput) {
    const result = await createAdmissionAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof AdmissionInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Application submitted.");
    router.push("/dashboard/admissions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Student Information */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Student Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" error={errors.firstName?.message} required>
            <Input placeholder="Muhammad" {...register("firstName")} className={cn(errors.firstName && "border-destructive")} />
          </Field>
          <Field label="Last Name" error={errors.lastName?.message} required>
            <Input placeholder="Ali" {...register("lastName")} className={cn(errors.lastName && "border-destructive")} />
          </Field>
          <Field label="Date of Birth" error={errors.dateOfBirth?.message} required>
            <Input type="date" {...register("dateOfBirth")} className={cn(errors.dateOfBirth && "border-destructive")} />
          </Field>
          <Field label="Gender" error={errors.gender?.message} required>
            <select
              {...register("gender")}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                errors.gender && "border-destructive"
              )}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Applying for Class" error={errors.applyingForClass?.message} required>
            <Input placeholder="e.g. Class 5, Grade 9" {...register("applyingForClass")} className={cn(errors.applyingForClass && "border-destructive")} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input placeholder="+92-300-1234567" {...register("phone")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="student@email.com" {...register("email")} />
          </Field>
          <Field label="Religion" error={errors.religion?.message}>
            <Input placeholder="Islam" {...register("religion")} />
          </Field>
          <Field label="Nationality" error={errors.nationality?.message}>
            <Input placeholder="Pakistani" {...register("nationality")} />
          </Field>
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Parent / Guardian Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" error={errors.parentFirstName?.message} required>
            <Input placeholder="Ahmed" {...register("parentFirstName")} className={cn(errors.parentFirstName && "border-destructive")} />
          </Field>
          <Field label="Last Name" error={errors.parentLastName?.message} required>
            <Input placeholder="Ali" {...register("parentLastName")} className={cn(errors.parentLastName && "border-destructive")} />
          </Field>
          <Field label="Email" error={errors.parentEmail?.message} required>
            <Input type="email" placeholder="parent@email.com" {...register("parentEmail")} className={cn(errors.parentEmail && "border-destructive")} />
          </Field>
          <Field label="Phone" error={errors.parentPhone?.message} required>
            <Input placeholder="+92-300-1234567" {...register("parentPhone")} className={cn(errors.parentPhone && "border-destructive")} />
          </Field>
          <Field label="Relation" error={errors.parentRelation?.message} required>
            <select
              {...register("parentRelation")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </select>
          </Field>
          <Field label="Occupation" error={errors.parentOccupation?.message}>
            <Input placeholder="Business" {...register("parentOccupation")} />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address" error={errors.address?.message}>
              <Input placeholder="123 Main Street" {...register("address")} />
            </Field>
          </div>
          <Field label="City" error={errors.city?.message}>
            <Input placeholder="Karachi" {...register("city")} />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <Input placeholder="Pakistan" {...register("country")} />
          </Field>
        </div>
      </div>

      {/* Previous School */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold font-display">Previous School</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optional — fill if student was previously enrolled elsewhere
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="School Name" error={errors.previousSchool?.message}>
            <Input placeholder="ABC School" {...register("previousSchool")} />
          </Field>
          <Field label="Last Class" error={errors.previousClass?.message}>
            <Input placeholder="Class 4" {...register("previousClass")} />
          </Field>
          <Field label="Grade / Result" error={errors.previousGrade?.message}>
            <Input placeholder="A+ / 90%" {...register("previousGrade")} />
          </Field>
        </div>
      </div>

      {/* Remarks */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Field label="Remarks" error={errors.remarks?.message}>
          <textarea
            {...register("remarks")}
            placeholder="Any additional notes..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admissions")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit Application
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}