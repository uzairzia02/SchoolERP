import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeacherById } from "@/features/teachers/actions/teacher.actions";
import { TeacherForm } from "@/features/teachers/components/teacher-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Teacher" };

export default async function EditTeacherPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getTeacherById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/teachers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Teacher</h1>
          <p className="text-sm text-muted-foreground">Update teacher information</p>
        </div>
      </div>
      <TeacherForm teacher={result.data} />
    </div>
  );
}