import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClassById } from "@/features/classes/actions/class.actions";
import { SectionList } from "@/features/classes/components/section-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Users, BookOpen, Layers } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getClassById(id);
  if (!result.success) return { title: "Class Not Found" };
  return { title: result.data.displayName };
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getClassById(id);

  if (!result.success) notFound();
  const cls = result.data;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/classes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display">{cls.displayName}</h1>
          <p className="text-sm text-muted-foreground">Class details and sections</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/classes/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold font-display mt-1">
                {cls._count.students}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Sections</p>
              <p className="text-2xl font-bold font-display mt-1">
                {cls._count.sections}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Layers className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Subjects</p>
              <p className="text-2xl font-bold font-display mt-1">
                {cls._count.subjects}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <SectionList classId={id} sections={cls.sections} />
    </div>
  );
}