"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X, UserPlus, Search } from "lucide-react";

import { assignFeeSchema, type AssignFeeInput } from "@/features/fees/schemas/fee.schema";
import { assignFeeAction, getFeeTypes } from "@/features/fees/actions/fee.actions";
import { getStudents } from "@/features/students/actions/student.actions";
import { getClassesForSelect } from "@/features/students/actions/student.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getInitials, cn } from "@/lib/utils";

type FeeTypeOption = { id: string; name: string; amount: number };
type ClassOption = { id: string; name: string; displayName: string };
type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string } | null;
};

export function AssignFeeForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssignFeeInput>({
    resolver: zodResolver(assignFeeSchema),
    defaultValues: {
      studentIds: [],
      discount: 0,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString()
        .split("T")[0],
    },
  });

  const selectedFeeTypeId = watch("feeTypeId");

  useEffect(() => {
    getFeeTypes().then(setFeeTypes);
    getClassesForSelect().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedFeeTypeId) {
      const feeType = feeTypes.find((f) => f.id === selectedFeeTypeId);
      if (feeType) {
        setValue("amount", feeType.amount);
      }
    }
  }, [selectedFeeTypeId, feeTypes, setValue]);

  useEffect(() => {
    setLoadingStudents(true);
    getStudents({
      classId: selectedClassId || undefined,
      search: studentSearch || undefined,
      pageSize: 50,
    }).then((result) => {
      setStudents(result.data);
      setLoadingStudents(false);
    });
  }, [selectedClassId, studentSearch]);

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  }

  async function onSubmit(values: AssignFeeInput) {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }

    const result = await assignFeeAction({
      ...values,
      studentIds: selectedStudents,
    });

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof AssignFeeInput, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Fee assigned successfully.");
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card border shadow-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold font-display">Assign Fee to Students</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Fee Details */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
            <h4 className="text-sm font-semibold">Fee Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fee Type *</Label>
                <select
                  {...register("feeTypeId")}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    errors.feeTypeId && "border-destructive"
                  )}
                >
                  <option value="">Select fee type</option>
                  {feeTypes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {formatCurrency(f.amount)}
                    </option>
                  ))}
                </select>
                {errors.feeTypeId && (
                  <p className="text-xs text-destructive">{errors.feeTypeId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Amount (PKR) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...register("amount")}
                  className={cn(errors.amount && "border-destructive")}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  {...register("dueDate")}
                  className={cn(errors.dueDate && "border-destructive")}
                />
                {errors.dueDate && (
                  <p className="text-xs text-destructive">{errors.dueDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Discount (PKR)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...register("discount")}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Remarks</Label>
                <Input
                  placeholder="Optional note..."
                  {...register("remarks")}
                />
              </div>
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">
              Select Students
              {selectedStudents.length > 0 && (
                <Badge className="ml-2 text-[10px]">
                  {selectedStudents.length} selected
                </Badge>
              )}
            </h4>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="rounded-xl border bg-card overflow-hidden max-h-64 overflow-y-auto">
              {/* Select All */}
              <div
                className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30 cursor-pointer hover:bg-muted/50"
                onClick={toggleAll}
              >
                <input
                  type="checkbox"
                  checked={
                    students.length > 0 &&
                    selectedStudents.length === students.length
                  }
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Select All ({students.length})
                </span>
              </div>

              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : students.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        selectedStudents.includes(student.id)
                          ? "bg-primary/5"
                          : "hover:bg-muted/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 rounded border-input"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {getInitials(`${student.firstName} ${student.lastName}`)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.admissionNumber}
                          {student.class && ` · Class ${student.class.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-muted/10">
          <p className="text-sm text-muted-foreground">
            {selectedStudents.length > 0
              ? `${selectedStudents.length} student(s) selected`
              : "No students selected"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || selectedStudents.length === 0}
              size="sm"
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Assign Fee
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}