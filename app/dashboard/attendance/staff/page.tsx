import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getStaffForAttendance } from "@/features/attendance/actions/attendance.actions";
import { StaffAttendanceClient } from "@/features/attendance/components/staff-attendance";

export const metadata: Metadata = { title: "Staff Attendance" };

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function StaffAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params.date ?? today;

  const result = await getStaffForAttendance(selectedDate);
  const staff = result.success ? result.data : [];

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Users className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Staff Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Mark daily staff attendance
          </p>
        </div>
      </div>

      <StaffAttendanceClient
        staff={staff}
        selectedDate={selectedDate}
      />
    </div>
  );
}