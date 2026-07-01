"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

import {
  employeeSchema,
  type EmployeeInput,
} from "@/features/employees/schemas/employee.schema";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/features/employees/actions/employee.actions";
import type { EmployeeDetail } from "@/features/employees/actions/employee.actions";
import {
  getDepartmentsForSelect,
  getDesignationsForSelect,
} from "@/features/teachers/actions/teacher.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EmployeeFormProps {
  employee?: EmployeeDetail;
}

type Option = { id: string; name: string };

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!employee;
  const [departments, setDepartments] = useState<Option[]>([]);
  const [designations, setDesignations] = useState<Option[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          dateOfBirth: employee.dateOfBirth
            ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: employee.gender as "MALE" | "FEMALE" | "OTHER",
          address: employee.address ?? "",
          employeeId: employee.employeeId,
          departmentId: employee.department?.id ?? "",
          designationId: employee.designation?.id ?? "",
          salary: employee.salary ?? undefined,
          joiningDate: new Date(employee.joiningDate)
            .toISOString()
            .split("T")[0],
        }
      : {
          joiningDate: new Date().toISOString().split("T")[0],
        },
  });

  const selectedDeptId = watch("departmentId");

  useEffect(() => {
    getDepartmentsForSelect().then(setDepartments);
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      getDesignationsForSelect(selectedDeptId).then(setDesignations);
    } else {
      setDesignations([]);
    }
  }, [selectedDeptId]);

  async function onSubmit(values: EmployeeInput) {
    const result = isEdit
      ? await updateEmployeeAction({ ...values, id: employee.id })
      : await createEmployeeAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof EmployeeInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Saved successfully.");
    router.push("/dashboard/employees");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="First Name" error={errors.firstName?.message} required>
            <Input
              placeholder="Ali"
              disabled={isSubmitting}
              {...register("firstName")}
              className={cn(errors.firstName && "border-destructive")}
            />
          </FormField>
          <FormField label="Last Name" error={errors.lastName?.message} required>
            <Input
              placeholder="Hassan"
              disabled={isSubmitting}
              {...register("lastName")}
              className={cn(errors.lastName && "border-destructive")}
            />
          </FormField>
          <FormField label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="ali.hassan@school.com"
              disabled={isEdit || isSubmitting}
              {...register("email")}
              className={cn(errors.email && "border-destructive")}
            />
          </FormField>
          <FormField label="Phone" error={errors.phone?.message} required>
            <Input
              placeholder="+92-300-1234567"
              disabled={isSubmitting}
              {...register("phone")}
              className={cn(errors.phone && "border-destructive")}
            />
          </FormField>
          <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
            <Input
              type="date"
              disabled={isSubmitting}
              {...register("dateOfBirth")}
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
          <div className="sm:col-span-2">
            <FormField label="Address" error={errors.address?.message}>
              <Input
                placeholder="123 Main Street, Karachi"
                disabled={isSubmitting}
                {...register("address")}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold font-display">Employment Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Employee ID" error={errors.employeeId?.message} required>
            <Input
              placeholder="EMP-101"
              disabled={isEdit || isSubmitting}
              {...register("employeeId")}
              className={cn(errors.employeeId && "border-destructive")}
            />
          </FormField>
          <FormField label="Joining Date" error={errors.joiningDate?.message} required>
            <Input
              type="date"
              disabled={isSubmitting}
              {...register("joiningDate")}
              className={cn(errors.joiningDate && "border-destructive")}
            />
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
          <FormField label="Monthly Salary (PKR)" error={errors.salary?.message}>
            <Input
              type="number"
              placeholder="50000"
              disabled={isSubmitting}
              {...register("salary")}
            />
          </FormField>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/employees")}
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
          {isEdit ? "Save Changes" : "Create Employee"}
        </Button>
      </div>
    </form>
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
