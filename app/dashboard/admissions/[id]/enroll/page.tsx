import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdmissionById } from "@/features/admissions/actions/admission.actions";
import { EnrollForm } from "@/features/admissions/components/enroll-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Enroll Student" };

export default async function EnrollStudentPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getAdmissionById(id);

  if (!result.success) notFound();

  // Only accepted applications can be enrolled
  if (result.data.status !== "ACCEPTED") {
    redirect(`/dashboard/admissions/${id}`);
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/admissions/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Enroll Student</h1>
          <p className="text-sm text-muted-foreground">
            Assign class, roll number, and fees — then create student account
          </p>
        </div>
      </div>
      <EnrollForm admission={result.data} />
    </div>
  );
}