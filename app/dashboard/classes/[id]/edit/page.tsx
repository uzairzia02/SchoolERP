9import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClassById } from "@/features/classes/actions/class.actions";
import { ClassForm } from "@/features/classes/components/class-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Class" };

export default async function EditClassPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getClassById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/classes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Class</h1>
          <p className="text-sm text-muted-foreground">Update class information</p>
        </div>
      </div>
      <ClassForm classData={result.data} />
    </div>
  );
}