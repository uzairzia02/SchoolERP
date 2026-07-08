import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDepartmentById } from "@/features/departments/actions/department.actions";
import { DepartmentDetailView } from "@/features/departments/components/department-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getDepartmentById(id);
  if (!result.success) return { title: "Not Found" };
  return { title: `${result.data.name} Department` };
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getDepartmentById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/departments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Department Detail</h1>
          <p className="text-sm text-muted-foreground">
            Staff and designations overview
          </p>
        </div>
      </div>
      <DepartmentDetailView department={result.data} />
    </div>
  );
}