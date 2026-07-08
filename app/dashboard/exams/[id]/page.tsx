import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamById } from "@/features/exams/actions/exam.actions";
import { ExamDetailView } from "@/features/exams/components/exam-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getExamById(id);
  if (!result.success) return { title: "Exam Not Found" };
  return { title: result.data.name };
}

export default async function ExamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getExamById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/exams"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Exam Detail</h1>
          <p className="text-sm text-muted-foreground">
            View exam information and manage grades
          </p>
        </div>
      </div>
      <ExamDetailView exam={result.data} />
    </div>
  );
}