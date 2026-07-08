import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getParentById } from "@/features/parents/actions/parent.actions";
import { ParentDetailView } from "@/features/parents/components/parent-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getParentById(id);
  if (!result.success) return { title: "Parent Not Found" };
  return { title: `${result.data.firstName} ${result.data.lastName}` };
}

export default async function ParentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getParentById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/parents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Parent Detail</h1>
          <p className="text-sm text-muted-foreground">
            Parent profile with children, attendance and fee overview
          </p>
        </div>
      </div>
      <ParentDetailView parent={result.data} />
    </div>
  );
}