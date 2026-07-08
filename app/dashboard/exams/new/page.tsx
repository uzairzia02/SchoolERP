import type { Metadata } from "next";
import { ExamForm } from "@/features/exams/components/exam-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "New Exam" };

export default function NewExamPage() {
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/exams"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Create Exam</h1>
          <p className="text-sm text-muted-foreground">Set up a new examination</p>
        </div>
      </div>
      <ExamForm />
    </div>
  );
}