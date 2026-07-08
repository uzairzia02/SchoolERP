import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmissionById } from "@/features/admissions/actions/admission.actions";
import { AdmissionDetailView } from "@/features/admissions/components/admission-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getAdmissionById(id);
  if (!result.success) return { title: "Not Found" };
  return { title: `${result.data.firstName} ${result.data.lastName} — Application` };
}

export default async function AdmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getAdmissionById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/admissions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Application Detail</h1>
          <p className="text-sm text-muted-foreground">
            Review and process admission application
          </p>
        </div>
      </div>
      <AdmissionDetailView admission={result.data} />
    </div>
  );
}