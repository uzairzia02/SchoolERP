"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AttendanceGrid } from "@/features/attendance/components/attendance-grid";
import type {
  StudentForAttendance,
  AttendanceSummary,
} from "@/features/attendance/actions/attendance.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface StudentAttendanceProps {
  classes: { id: string; name: string; displayName: string }[];
  sections: { id: string; name: string }[];
  students: StudentForAttendance[];
  summary: AttendanceSummary;
  selectedClassId: string;
  selectedSectionId: string;
  selectedDate: string;
}

export function StudentAttendanceClient({
  classes,
  sections,
  students,
  summary,
  selectedClassId,
  selectedSectionId,
  selectedDate,
}: StudentAttendanceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string>) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, value]) => {
      if (value) current.set(key, value);
      else current.delete(key);
    });
    startTransition(() => {
      router.push(`${pathname}?${current.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border bg-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => updateParams({ date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <select
              value={selectedClassId}
              onChange={(e) =>
                updateParams({ classId: e.target.value, sectionId: "" })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Section (Optional)</Label>
            <select
              value={selectedSectionId}
              onChange={(e) => updateParams({ sectionId: e.target.value })}
              disabled={!selectedClassId || sections.length === 0}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !selectedClassId ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-muted-foreground">
            Select a class to mark attendance
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a class and date from the filters above
          </p>
        </div>
      ) : (
        <AttendanceGrid
          students={students}
          classId={selectedClassId}
          sectionId={selectedSectionId || undefined}
          date={selectedDate}
          initialSummary={summary}
        />
      )}
    </div>
  );
}