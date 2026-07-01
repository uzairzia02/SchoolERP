import type { Metadata } from "next";
import { getTeachers } from "@/features/teachers/actions/teacher.actions";
import { TeacherTable } from "@/features/teachers/components/teacher-table";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Teachers" };

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; departmentId?: string }>;
}

export default async function TeachersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getTeachers({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    departmentId: params.departmentId,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Users className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Teachers</h1>
          <p className="text-sm text-muted-foreground">Manage all teaching staff</p>
        </div>
      </div>
      <TeacherTable initialData={data} />
    </div>
  );
}