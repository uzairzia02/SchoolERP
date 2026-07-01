import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeacherById } from "@/features/teachers/actions/teacher.actions";
import { TeacherDetailView } from "@/features/teachers/components/teacher-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getTeacherById(id);
  if (!result.success) return { title: "Teacher Not Found" };
  return { title: `${result.data.firstName} ${result.data.lastName}` };
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getTeacherById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/teachers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Teacher Detail</h1>
          <p className="text-sm text-muted-foreground">View teacher information</p>
        </div>
      </div>
      <TeacherDetailView teacher={result.data} />
    </div>
  );
}