import type { Metadata } from "next";
import { getAttendanceReport } from "@/features/reports/actions/report.actions";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { AttendanceReport } from "@/features/reports/components/attendance-report";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Attendance Report" };

interface PageProps {
  searchParams: Promise<{
    classId?: string;
    sectionId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AttendanceReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const today = now.toISOString().split("T")[0];

  const startDate = params.startDate ?? firstDay;
  const endDate = params.endDate ?? today;

  const [data, classes] = await Promise.all([
    getAttendanceReport({
      classId: params.classId,
      sectionId: params.sectionId,
      startDate,
      endDate,
    }),
    getClassesForSelect(),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Attendance Report</h1>
          <p className="text-sm text-muted-foreground">
            Student attendance analysis with percentage breakdown
          </p>
        </div>
      </div>
      <AttendanceReport
        data={data}
        classes={classes}
        params={{ classId: params.classId, sectionId: params.sectionId, startDate, endDate }}
      />
    </div>
  );
}