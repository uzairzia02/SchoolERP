import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, PlayCircle } from "lucide-react";
import {
  getPayrollRecords,
  getPayrollSummary,
} from "@/features/payroll/actions/payroll.actions";
import { PayrollTable } from "@/features/payroll/components/payroll-table";
import { PayrollSummaryCards } from "@/features/payroll/components/payroll-summary";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Payroll" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    month?: string;
    year?: string;
    search?: string;
  }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function PayrollPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const selectedMonth = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const selectedYear = params.year ? parseInt(params.year) : now.getFullYear();

  const [payrollData, summary] = await Promise.all([
    getPayrollRecords({
      page: params.page ? parseInt(params.page) : 1,
      month: selectedMonth,
      year: selectedYear,
      search: params.search,
    }),
    getPayrollSummary(),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Banknote className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Payroll</h1>
            <p className="text-sm text-muted-foreground">
              Manage employee salaries and payments
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/payroll/process">
            <PlayCircle className="h-4 w-4 mr-2" />
            Process Payroll
          </Link>
        </Button>
      </div>

      <PayrollSummaryCards
        summary={summary}
        currentMonth={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
      />

      <PayrollTable
        initialData={payrollData}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
}