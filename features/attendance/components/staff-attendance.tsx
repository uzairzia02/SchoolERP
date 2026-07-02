"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import type { StaffForAttendance } from "@/features/attendance/actions/attendance.actions";
import { markStaffAttendanceAction } from "@/features/attendance/actions/attendance.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  bg: string;
}[] = [
  { value: "PRESENT", label: "P", bg: "bg-emerald-500" },
  { value: "ABSENT", label: "A", bg: "bg-red-500" },
  { value: "LATE", label: "L", bg: "bg-yellow-500" },
  { value: "HALF_DAY", label: "H", bg: "bg-orange-500" },
  { value: "LEAVE", label: "LV", bg: "bg-blue-500" },
];

interface StaffAttendanceClientProps {
  staff: StaffForAttendance[];
  selectedDate: string;
}

export function StaffAttendanceClient({
  staff,
  selectedDate,
}: StaffAttendanceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(
      staff.map((s) => [s.id, s.attendance?.status ?? "PRESENT"])
    )
  );

  function updateDate(date: string) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("date", date);
    startTransition(() => {
      router.push(`${pathname}?${current.toString()}`);
    });
  }

  function setStatus(staffId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [staffId]: status }));
  }

  async function handleSave() {
    setIsSaving(true);
    const result = await markStaffAttendanceAction({
      date: selectedDate,
      records: staff.map((s) => ({
        staffId: s.id,
        staffType: s.type,
        status: records[s.id] ?? "PRESENT",
      })),
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Staff attendance saved.");
    router.refresh();
  }

  const present = Object.values(records).filter((s) => s === "PRESENT").length;
  const absent = Object.values(records).filter((s) => s === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="rounded-xl border bg-card p-5">
        <div className="max-w-xs space-y-1.5">
          <Label>Date</Label>
          <Input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => updateDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-emerald-600">
            {present}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Present</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-red-600">
            {absent}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Absent</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold font-display">{staff.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
      </div>

      {/* Staff Table */}
      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-muted-foreground">No staff found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add teachers or employees first
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const currentStatus = records[member.id] ?? "PRESENT";
                  return (
                    <tr
                      key={member.id}
                      className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              member.type === "TEACHER"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-orange-500/10 text-orange-600"
                            )}
                          >
                            {getInitials(
                              `${member.firstName} ${member.lastName}`
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {member.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            member.type === "TEACHER" ? "default" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {member.type === "TEACHER" ? "Teacher" : "Employee"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {member.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(member.id, opt.value)}
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
      )}

      {staff.length > 0 && (
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
      )}
    </div>
  );
}