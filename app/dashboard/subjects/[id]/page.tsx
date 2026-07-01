import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubjectById } from "@/features/subjects/actions/subject.actions";
import { SubjectDetailView } from "@/features/subjects/components/subject-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getSubjectById(id);
  if (!result.success) return { title: "Subject Not Found" };
  return { title: result.data.name };
}

export default async function SubjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getSubjectById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/subjects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Subject Detail</h1>
          <p className="text-sm text-muted-foreground">
            View subject information and assigned teachers
          </p>
        </div>
      </div>
      <SubjectDetailView subject={result.data} />
    </div>
  );
}