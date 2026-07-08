import type { Metadata } from "next";
import { getPayrollReport } from "@/features/reports/actions/report.actions";
import { PayrollReport } from "@/features/reports/components/payroll-report";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Payroll Report" };

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    departmentId?: string;
  }>;
}

export default async function PayrollReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const selectedMonth = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const selectedYear = params.year ? parseInt(params.year) : now.getFullYear();

  const [{ rows, summary }, departments] = await Promise.all([
    getPayrollReport({
      month: selectedMonth,
      year: selectedYear,
      departmentId: params.departmentId,
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
          <h1 className="text-2xl font-bold font-display">Payroll Report</h1>
          <p className="text-sm text-muted-foreground">
            Monthly payroll breakdown and summary
          </p>
        </div>
      </div>
      <PayrollReport
        rows={rows}
        summary={summary}
        departments={departments}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
}