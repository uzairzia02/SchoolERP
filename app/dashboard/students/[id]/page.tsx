import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStudentById } from "@/features/students/actions/student.actions";
import { StudentDetailView } from "@/features/students/components/student-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getStudentById(id);
  if (!result.success) return { title: "Student Not Found" };
  return { title: `${result.data.firstName} ${result.data.lastName}` };
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getStudentById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Student Detail</h1>
          <p className="text-sm text-muted-foreground">
            View student information
          </p>
        </div>
      </div>
      <StudentDetailView student={result.data} />
    </div>
  );
}