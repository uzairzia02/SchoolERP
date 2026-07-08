import type { Metadata } from "next";
import { getFeeReport } from "@/features/reports/actions/report.actions";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { getFeeTypes } from "@/features/fees/actions/fee.actions";
import { FeeReport } from "@/features/reports/components/fee-report";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Fee Report" };

interface PageProps {
  searchParams: Promise<{
    classId?: string;
    feeTypeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function FeeReportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [{ rows, summary }, classes, feeTypes] = await Promise.all([
    getFeeReport({
      classId: params.classId,
      feeTypeId: params.feeTypeId,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    getClassesForSelect(),
    getFeeTypes(),
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
          <h1 className="text-2xl font-bold font-display">Fee Report</h1>
          <p className="text-sm text-muted-foreground">
            Fee collection and pending analysis
          </p>
        </div>
      </div>
      <FeeReport
        rows={rows}
        summary={summary}
        classes={classes}
        feeTypes={feeTypes}
      />
    </div>
  );
}