"use client";

import { useState } from "react";
import type {
  StudentForAttendance,
  AttendanceSummary,
} from "@/features/attendance/actions/attendance.actions";
import { markStudentAttendanceAction } from "@/features/attendance/actions/attendance.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { AttendanceSummaryCards } from "@/features/attendance/components/attendance-summary";
import type { AttendanceStatus } from "@prisma/client";

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "PRESENT",
    label: "P",
    color: "text-emerald-700",
    bg: "bg-emerald-500",
  },
  {
    value: "ABSENT",
    label: "A",
    color: "text-red-700",
    bg: "bg-red-500",
  },
  {
    value: "LATE",
    label: "L",
    color: "text-yellow-700",
    bg: "bg-yellow-500",
  },
  {
    value: "HALF_DAY",
    label: "H",
    color: "text-orange-700",
    bg: "bg-orange-500",
  },
  {
    value: "LEAVE",
    label: "LV",
    color: "text-blue-700",
    bg: "bg-blue-500",
  },
];

interface AttendanceGridProps {
  students: StudentForAttendance[];
  classId: string;
  sectionId?: string;
  date: string;
  initialSummary: AttendanceSummary;
}

export function AttendanceGrid({
  students,
  classId,
  sectionId,
  date,
  initialSummary,
}: AttendanceGridProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(
      students.map((s) => [s.id, s.attendance?.status ?? "PRESENT"])
    )
  );

  // Compute live summary
  const liveSummary: AttendanceSummary = {
    present: Object.values(records).filter((s) => s === "PRESENT").length,
    absent: Object.values(records).filter((s) => s === "ABSENT").length,
    late: Object.values(records).filter((s) => s === "LATE").length,
    halfDay: Object.values(records).filter((s) => s === "HALF_DAY").length,
    leave: Object.values(records).filter((s) => s === "LEAVE").length,
    total: students.length,
    percentage: 0,
  };
  liveSummary.percentage =
    liveSummary.total > 0
      ? Math.round((liveSummary.present / liveSummary.total) * 100)
      : 0;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAll(status: AttendanceStatus) {
    const all = Object.fromEntries(students.map((s) => [s.id, status]));
    setRecords(all);
  }

  async function handleSave() {
    setIsSaving(true);
    const result = await markStudentAttendanceAction({
      date,
      classId,
      sectionId,
      records: Object.entries(records).map(([studentId, status]) => ({
        studentId,
        status,
      })),
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Attendance saved successfully.");
    router.refresh();
  }

  if (students.length === 0) {
    return (
      <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
        <p className="font-medium text-muted-foreground">No students found</p>
        <p className="text-xs text-muted-foreground mt-1">
          No students enrolled in this class/section
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <AttendanceSummaryCards summary={liveSummary} />

      {/* Quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Mark all as:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => markAll(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80 ${opt.bg}`}
          >
            {opt.label === "P"
              ? "Present"
              : opt.label === "A"
              ? "Absent"
              : opt.label === "L"
              ? "Late"
              : opt.label === "H"
              ? "Half Day"
              : "Leave"}
          </button>
        ))}
      </div>

      {/* Student Grid */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Student
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Roll #
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const currentStatus = records[student.id] ?? "PRESENT";
                return (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(
                            `${student.firstName} ${student.lastName}`
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.admissionNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {student.rollNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setStatus(student.id, opt.value)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all border-2",
                              currentStatus === opt.value
                                ? `${opt.bg} text-white border-transparent`
                                : "bg-muted/50 text-muted-foreground border-transparent hover:border-muted-foreground/30"
                            )}
                            title={opt.value.replace("_", " ")}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Attendance
        </Button>
      </div>
    </div>
  );
}