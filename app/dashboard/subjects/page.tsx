import type { Metadata } from "next";
import { getSubjects } from "@/features/subjects/actions/subject.actions";
import { SubjectTable } from "@/features/subjects/components/subject-table";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Subjects" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    classId?: string;
  }>;
}

export default async function SubjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getSubjects({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    classId: params.classId,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <BookOpen className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Subjects</h1>
          <p className="text-sm text-muted-foreground">
            Manage all subjects and their assignments
          </p>
        </div>
      </div>
      <SubjectTable initialData={data} />
    </div>
  );
}