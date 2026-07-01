import type { Metadata } from "next";
import { Suspense } from "react";
import { getStudents } from "@/features/students/actions/student.actions";
import { StudentTable } from "@/features/students/components/student-table";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = { title: "Students" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    classId?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getStudents({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    classId: params.classId,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage all enrolled students
          </p>
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <StudentTable initialData={data} />
      </Suspense>
    </div>
  );
}