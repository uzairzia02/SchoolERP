import type { Metadata } from "next";
import { getStaffReport } from "@/features/reports/actions/report.actions";
import { StaffReport } from "@/features/reports/components/staff-report";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Staff Report" };

interface PageProps {
  searchParams: Promise<{
    type?: string;
    departmentId?: string;
    isActive?: string;
  }>;
}

export default async function StaffReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [data, departments] = await Promise.all([
    getStaffReport({
      type: params.type as "TEACHER" | "EMPLOYEE" | undefined,
      departmentId: params.departmentId,
      isActive:
        params.isActive === "true"
          ? true
          : params.isActive === "false"
          ? false
          : undefined,
    }),
    db.department.findMany({
      where: { schoolId: session.user.schoolId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Staff Report</h1>
          <p className="text-sm text-muted-foreground">
            Complete staff listing with HR details
          </p>
        </div>
      </div>
      <StaffReport data={data} departments={departments} />
    </div>
  );
}