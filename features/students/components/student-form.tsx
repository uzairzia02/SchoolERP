"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle2, Copy } from "lucide-react";

import { studentSchema, type StudentInput } from "@/features/students/schemas/student.schema";
import {
  createStudentAction,
  updateStudentAction,
  getClassesForSelect,
  getSectionsForSelect,
} from "@/features/students/actions/student.actions";
import type { StudentDetail } from "@/features/students/actions/student.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StudentFormProps {
  student?: StudentDetail;
}

type ClassOption = { id: string; name: string; displayName: string };
type SectionOption = { id: string; name: string };

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter();
  const isEdit = !!student;
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{
    admissionNumber: string;
    email: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: new Date(student.dateOfBirth).toISOString().split("T")[0],
          gender: student.gender as "MALE" | "FEMALE" | "OTHER",
          bloodGroup: (student.bloodGroup as StudentInput["bloodGroup"]) ?? undefined,
          religion: student.religion ?? "",
          nationality: student.nationality ?? "",
          phone: student.phone ?? "",
          address: student.address ?? "",
          city: student.city ?? "",
          state: student.state ?? "",
          country: student.country ?? "",
          zipCode: student.zipCode ?? "",
          classId: student.class?.id ?? "",
          sectionId: student.section?.id ?? "",
          rollNumber: student.rollNumber ?? "",
          admissionDate: new Date(student.admissionDate).toISOString().split("T")[0],
        }
      : {
          admissionDate: new Date().toISOString().split("T")[0],
        },
  });

  const selectedClassId = watch("classId");

  useEffect(() => {
    getClassesForSelect().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      getSectionsForSelect(selectedClassId).then(setSections);
    } else {
      setSections([]);
    }
  }, [selectedClassId]);

  async function onSubmit(values: StudentInput) {
    if (isEdit) {
      const result = await updateStudentAction({ ...values, id: student.id });

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof StudentInput, { message: messages[0] });
          });
        }
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Student updated!");
      router.push("/dashboard/students");
      router.refresh();
      return;
    }

    const result = await createStudentAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof StudentInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    // result.data is correctly typed here as { id, admissionNumber, studentEmail }
    // since this branch only ever calls createStudentAction — no cast needed.
    setCreatedCredentials({
      admissionNumber: result.data.admissionNumber,
      email: result.data.studentEmail,
    });
  }

  function handleDialogClose() {
    setCreatedCredentials(null);
    router.push("/dashboard/students");
    router.refresh();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.firstName?.message} required>
              <Input
                placeholder="Muhammad"
                disabled={isSubmitting}
                {...register("firstName")}
                className={cn(errors.firstName && "border-destructive")}
              />
            </FormField>
            <FormField label="Last Name" error={errors.lastName?.message} required>
              <Input
                placeholder="Ali"
                disabled={isSubmitting}
                {...register("lastName")}
                className={cn(errors.lastName && "border-destructive")}
              />
            </FormField>
            <FormField label="Date of Birth" error={errors.dateOfBirth?.message} required>
              <Input
                type="date"
                disabled={isSubmitting}
                {...register("dateOfBirth")}
                className={cn(errors.dateOfBirth && "border-destructive")}
              />
            </FormField>
            <FormField label="Gender" error={errors.gender?.message} required>
              <select
                {...register("gender")}
                disabled={isSubmitting}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                  errors.gender && "border-destructive"
                )}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Blood Group" error={errors.bloodGroup?.message}>
              <select
                {...register("bloodGroup")}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Select blood group</option>
                {["A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE","AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE"].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Religion" error={errors.religion?.message}>
              <Input placeholder="Islam" disabled={isSubmitting} {...register("religion")} />
            </FormField>
            <FormField label="Nationality" error={errors.nationality?.message}>
              <Input placeholder="Pakistani" disabled={isSubmitting} {...register("nationality")} />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <Input
                placeholder="+92-300-1234567"
                disabled={isSubmitting}
                {...register("phone")}
              />
            </FormField>
          </div>
        </div>

        {/* Admission Information */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Admission Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admission Number: auto-generated on create, read-only display on edit */}
            {isEdit && (
              <FormField label="Admission Number">
                <Input value={student.admissionNumber} disabled className="bg-muted" />
              </FormField>
            )}
            {!isEdit && (
              <div className="sm:col-span-2 rounded-lg bg-muted/50 border border-dashed p-3 text-xs text-muted-foreground">
                Admission number and login credentials will be generated automatically after creation.
              </div>
            )}
            <FormField label="Admission Date" error={errors.admissionDate?.message} required>
              <Input
                type="date"
                disabled={isSubmitting}
                {...register("admissionDate")}
                className={cn(errors.admissionDate && "border-destructive")}
              />
            </FormField>
            <FormField label="Class" error={errors.classId?.message}>
              <select
                {...register("classId")}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Section" error={errors.sectionId?.message}>
              <select
                {...register("sectionId")}
                disabled={isSubmitting || sections.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Select section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Roll Number" error={errors.rollNumber?.message}>
              <Input placeholder="01" disabled={isSubmitting} {...register("rollNumber")} />
            </FormField>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Street Address" error={errors.address?.message}>
                <Input placeholder="123 Main Street" disabled={isSubmitting} {...register("address")} />
              </FormField>
            </div>
            <FormField label="City" error={errors.city?.message}>
              <Input placeholder="Karachi" disabled={isSubmitting} {...register("city")} />
            </FormField>
            <FormField label="State" error={errors.state?.message}>
              <Input placeholder="Sindh" disabled={isSubmitting} {...register("state")} />
            </FormField>
            <FormField label="Country" error={errors.country?.message}>
              <Input placeholder="Pakistan" disabled={isSubmitting} {...register("country")} />
            </FormField>
            <FormField label="ZIP Code" error={errors.zipCode?.message}>
              <Input placeholder="75500" disabled={isSubmitting} {...register("zipCode")} />
            </FormField>
          </div>
        </div>

        {/* Parent Information — only on create */}
        {!isEdit && (
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <h3 className="font-semibold font-display">Parent / Guardian</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                If the phone number matches an existing parent, the new student will be linked to that
                parent&apos;s account automatically instead of creating a duplicate.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.parentFirstName?.message}>
                <Input placeholder="Ahmed" disabled={isSubmitting} {...register("parentFirstName")} />
              </FormField>
              <FormField label="Last Name" error={errors.parentLastName?.message}>
                <Input placeholder="Ali" disabled={isSubmitting} {...register("parentLastName")} />
              </FormField>
              <FormField label="Email" error={errors.parentEmail?.message}>
                <Input
                  type="email"
                  placeholder="parent@email.com"
                  disabled={isSubmitting}
                  {...register("parentEmail")}
                />
              </FormField>
              <FormField label="Phone" error={errors.parentPhone?.message} required>
                <Input
                  placeholder="0300-1234567"
                  disabled={isSubmitting}
                  {...register("parentPhone")}
                  className={cn(errors.parentPhone && "border-destructive")}
                />
              </FormField>
              <FormField label="Relation" error={errors.parentRelation?.message}>
                <select
                  {...register("parentRelation")}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">Select relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/students")}
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
            {isEdit ? "Save Changes" : "Create Student"}
          </Button>
        </div>
      </form>

      {/* Success dialog with generated credentials */}
      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Student Created Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Share these login credentials with the student:
            </p>

            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Admission Number</p>
                  <p className="text-sm font-mono font-medium">{createdCredentials?.admissionNumber}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(createdCredentials?.admissionNumber ?? "")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Login Email</p>
                  <p className="text-sm font-mono font-medium">{createdCredentials?.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(createdCredentials?.email ?? "")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Default Password</p>
                <p className="text-sm font-mono font-medium">Test@123</p>
              </div>
            </div>

            <p className="text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
              Recommend the student changes this password after their first login.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleDialogClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper Component
// ─────────────────────────────────────────────────────────────

function FormField({
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
