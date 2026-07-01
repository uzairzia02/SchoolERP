import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSubjectById } from "@/features/subjects/actions/subject.actions";
import { SubjectForm } from "@/features/subjects/components/subject-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Subject" };

export default async function EditSubjectPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getSubjectById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/subjects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Subject</h1>
          <p className="text-sm text-muted-foreground">Update subject information</p>
        </div>
      </div>
      <SubjectForm subject={result.data} />
    </div>
  );
}