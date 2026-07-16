"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle2, Copy } from "lucide-react";
import { z } from "zod";

import { teacherSchema } from "@/features/teachers/schemas/teacher.schema";
import {
  createTeacherAction,
  updateTeacherAction,
  getDepartmentsForSelect,
  getDesignationsForSelect,
  getSubjectsForSelect,
} from "@/features/teachers/actions/teacher.actions";
import type { TeacherDetail } from "@/features/teachers/actions/teacher.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TeacherFormProps {
  teacher?: TeacherDetail;
}

type Option = { id: string; name: string };
type SubjectOption = { id: string; name: string; code: string };

// Separate input/output types because `experience` uses z.coerce.number(),
// which makes the pre-parse (string) and post-parse (number) shapes differ.
// Without this split, useForm<TeacherInput> causes a type mismatch on submit.
type FormInput = z.input<typeof teacherSchema>;
type FormOutput = z.output<typeof teacherSchema>;

export function TeacherForm({ teacher }: TeacherFormProps) {
  const router = useRouter();
  const isEdit = !!teacher;
  const [departments, setDepartments] = useState<Option[]>([]);
  const [designations, setDesignations] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    teacher?.subjects.map((s) => s.subject.id) ?? []
  );
  const [createdCredentials, setCreatedCredentials] = useState<{
    employeeId: string;
    email: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(teacherSchema),
    defaultValues: teacher
      ? {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phone,
          dateOfBirth: teacher.dateOfBirth
            ? new Date(teacher.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: teacher.gender as "MALE" | "FEMALE" | "OTHER",
          address: teacher.address ?? "",
          departmentId: teacher.department?.id ?? "",
          designationId: teacher.designation?.id ?? "",
          qualification: teacher.qualification ?? "",
          experience: teacher.experience ?? undefined,
          joiningDate: new Date(teacher.joiningDate).toISOString().split("T")[0],
        }
      : {
          joiningDate: new Date().toISOString().split("T")[0],
        },
  });

  const selectedDeptId = watch("departmentId");

  useEffect(() => {
    getDepartmentsForSelect().then(setDepartments);
    getSubjectsForSelect().then(setSubjects);
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      getDesignationsForSelect(selectedDeptId).then(setDesignations);
    } else {
      setDesignations([]);
    }
  }, [selectedDeptId]);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function onSubmit(values: FormOutput) {
    if (isEdit) {
      const result = await updateTeacherAction({
        ...values,
        subjectIds: selectedSubjects,
        id: teacher.id,
      });

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof FormOutput, { message: messages[0] });
          });
        }
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Teacher updated!");
      router.push("/dashboard/teachers");
      router.refresh();
      return;
    }

    const result = await createTeacherAction({ ...values, subjectIds: selectedSubjects });

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FormOutput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    setCreatedCredentials({
      employeeId: result.data.employeeId,
      email: result.data.teacherEmail,
    });
  }

  function handleDialogClose() {
    setCreatedCredentials(null);
    router.push("/dashboard/teachers");
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
              <Input placeholder="Sarah" disabled={isSubmitting} {...register("firstName")} className={cn(errors.firstName && "border-destructive")} />
            </FormField>
            <FormField label="Last Name" error={errors.lastName?.message} required>
              <Input placeholder="Khan" disabled={isSubmitting} {...register("lastName")} className={cn(errors.lastName && "border-destructive")} />
            </FormField>

            {isEdit && (
              <FormField label="Email">
                <Input value={teacher.email} disabled className="bg-muted" />
              </FormField>
            )}

            <FormField label="Phone" error={errors.phone?.message} required>
              <Input placeholder="+92-300-1234567" disabled={isSubmitting} {...register("phone")} className={cn(errors.phone && "border-destructive")} />
            </FormField>
            <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
              <Input type="date" disabled={isSubmitting} {...register("dateOfBirth")} />
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
            <div className="sm:col-span-2">
              <FormField label="Address" error={errors.address?.message}>
                <Input placeholder="123 Main Street, Karachi" disabled={isSubmitting} {...register("address")} />
              </FormField>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Employment Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEdit && (
              <FormField label="Employee ID">
                <Input value={teacher.employeeId} disabled className="bg-muted" />
              </FormField>
            )}
            {!isEdit && (
              <div className="sm:col-span-2 rounded-lg bg-muted/50 border border-dashed p-3 text-xs text-muted-foreground">
                Employee ID and login credentials will be generated automatically after creation.
              </div>
            )}
            <FormField label="Joining Date" error={errors.joiningDate?.message} required>
              <Input type="date" disabled={isSubmitting} {...register("joiningDate")} className={cn(errors.joiningDate && "border-destructive")} />
            </FormField>
            <FormField label="Department" error={errors.departmentId?.message}>
              <select
                {...register("departmentId")}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Designation" error={errors.designationId?.message}>
              <select
                {...register("designationId")}
                disabled={isSubmitting || designations.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Select designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Qualification" error={errors.qualification?.message}>
              <Input placeholder="M.Sc Mathematics" disabled={isSubmitting} {...register("qualification")} />
            </FormField>
            <FormField label="Experience (years)" error={errors.experience?.message}>
              <Input type="number" placeholder="5" disabled={isSubmitting} {...register("experience")} />
            </FormField>
          </div>
        </div>

        {/* Subjects */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <h3 className="font-semibold font-display">Subjects Taught</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select subjects this teacher will teach</p>
          </div>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subjects available. Add subjects first to assign them here.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                    selectedSubjects.includes(subject.id)
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  <span className="truncate">{subject.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/teachers")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Create Teacher"}
          </Button>
        </div>
      </form>

      {/* Success dialog with generated credentials */}
      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Teacher Created Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Share these login credentials with the teacher:
            </p>

            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-mono font-medium">{createdCredentials?.employeeId}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(createdCredentials?.employeeId ?? "")}
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
              Recommend the teacher changes this password after their first login.
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
