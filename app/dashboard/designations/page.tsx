import type { Metadata } from "next";
import { Tag, Building2 } from "lucide-react";
import { getDesignations } from "@/features/departments/actions/department.actions";
import { DesignationTable } from "@/features/departments/components/designation-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Designations" };

export default async function DesignationsPage() {
  const designations = await getDesignations();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Tag className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Designations</h1>
            <p className="text-sm text-muted-foreground">
              All job titles and designations across departments
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/departments">
            <Building2 className="h-4 w-4 mr-2" />
            Departments
          </Link>
        </Button>
      </div>

      <DesignationTable designations={designations} />
    </div>
  );
}