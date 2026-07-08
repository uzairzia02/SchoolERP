import type { Metadata } from "next";
import { getStudentReport } from "@/features/reports/actions/report.actions";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { StudentReport } from "@/features/reports/components/student-report";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Student Report" };

interface PageProps {
  searchParams: Promise<{
    classId?: string;
    sectionId?: string;
    isActive?: string;
    gender?: string;
  }>;
}

export default async function StudentReportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [data, classes] = await Promise.all([
    getStudentReport({
      classId: params.classId,
      sectionId: params.sectionId,
      isActive: params.isActive === "true" ? true : params.isActive === "false" ? false : undefined,
      gender: params.gender,
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
          <h1 className="text-2xl font-bold font-display">Student Report</h1>
          <p className="text-sm text-muted-foreground">
            Complete student listing with all details
          </p>
        </div>
      </div>
      <StudentReport data={data} classes={classes} />
    </div>
  );
}