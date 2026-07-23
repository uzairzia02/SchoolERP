import type { Metadata } from "next";
import { getAttendanceReport, getStaffAttendanceReport } from "@/features/reports/actions/report.actions";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { AttendanceReport } from "@/features/reports/components/attendance-report";
import { StaffAttendanceReport } from "@/features/reports/components/staff-attendance-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Users } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Attendance Report" };

interface PageProps {
  searchParams: Promise<{
    classId?: string;
    sectionId?: string;
    startDate?: string;
    endDate?: string;
    tab?: string;
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
  const activeTab = params.tab ?? "students";

  const [studentData, staffData, classes] = await Promise.all([
    getAttendanceReport({
      classId: params.classId,
      sectionId: params.sectionId,
      startDate,
      endDate,
    }),
    getStaffAttendanceReport({
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
            Student & Staff attendance analysis
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="students">
            <GraduationCap className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <AttendanceReport
            data={studentData}
            classes={classes}
            params={{
              classId: params.classId,
              sectionId: params.sectionId,
              startDate,
              endDate,
            }}
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <StaffAttendanceReport
            data={staffData}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}