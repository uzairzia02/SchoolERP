import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStudentById } from "@/features/students/actions/student.actions";
import { StudentForm } from "@/features/students/components/student-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Student" };

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getStudentById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/students/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Student</h1>
          <p className="text-sm text-muted-foreground">
            Update student information
          </p>
        </div>
      </div>
      <StudentForm student={result.data} />
    </div>
  );
}