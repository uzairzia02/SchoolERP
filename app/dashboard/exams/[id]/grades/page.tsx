import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStudentsForGradeEntry } from "@/features/exams/actions/exam.actions";
import { GradeEntry } from "@/features/exams/components/grade-entry";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Enter Grades" };

export default async function GradesPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getStudentsForGradeEntry(id);

  if (!data) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/exams/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Enter Grades</h1>
          <p className="text-sm text-muted-foreground">
            Enter marks for each student — grades auto-calculate
          </p>
        </div>
      </div>
      <GradeEntry exam={data.exam} students={data.students} />
    </div>
  );
}