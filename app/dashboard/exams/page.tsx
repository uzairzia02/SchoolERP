import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getExams } from "@/features/exams/actions/exam.actions";
import { ExamTable } from "@/features/exams/components/exam-table";
import { Button } from "@/components/ui/button";
import type { ExamType } from "@prisma/client";

export const metadata: Metadata = { title: "Examinations" };

const ALLOWED_ROLES = ["TEACHER", "FACULTY", "PRINCIPAL", "SUPER_ADMIN"];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    classId?: string;
  }>;
}

export default async function ExamsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/login");

  const params = await searchParams;

  const data = await getExams({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    type: params.type as ExamType | undefined,
    classId: params.classId,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Examinations</h1>
            <p className="text-sm text-muted-foreground">
              Manage exams and enter student grades
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/exams/new">
            <Plus className="h-4 w-4 mr-2" />
            New Exam
          </Link>
        </Button>
      </div>

      <ExamTable initialData={data} />
    </div>
  );
}
