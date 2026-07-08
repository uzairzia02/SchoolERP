"use client";

import type {
  PayrollReportRow,
  PayrollSummaryReport,
} from "@/features/reports/actions/report.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { Banknote, Users, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PayrollReportProps {
  rows: PayrollReportRow[];
  summary: PayrollSummaryReport;
  departments: { id: string; name: string }[];
  selectedMonth: number;
  selectedYear: number;
}

function exportCSV(rows: PayrollReportRow[], month: number, year: number) {
  const headers = [
    "Employee ID", "Name", "Department", "Designation",
    "Month", "Year", "Basic Salary", "Allowances",
    "Deductions", "Net Salary", "Payment Method", "Paid Date",
  ];
  const data = rows.map((r) => [
    r.employeeId, r.name, r.department, r.designation,
    MONTHS[r.month - 1], r.year,
    r.basicSalary, r.allowances, r.deductions, r.netSalary,
    r.paymentMethod ?? "—",
    r.paidDate ? formatDate(r.paidDate) : "—",
  ]);

  const csv = [headers, ...data].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll-${MONTHS[month - 1]}-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PayrollReport({
  rows,
  summary,
  departments,
  selectedMonth,
  selectedYear,
}: PayrollReportProps) {
  return (
    <div className="space-y-6">
      <ReportFilters
        fields={[
          {
            key: "month",
            label: "Month",
            type: "select",
            options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
          },
          {
            key: "year",
            label: "Year",
            type: "select",
            options: [2024, 2025, 2026, 2027].map((y) => ({
              value: String(y),
              label: String(y),
            })),
          },
          {
            key: "departmentId",
            label: "Department",
            type: "select",
            options: departments.map((d) => ({ value: d.id, label: d.name })),
          },
        ]}
        onExportCSV={() => exportCSV(rows, selectedMonth, selectedYear)}
        onPrint={() => window.print()}
      />

      {/* Period Info */}
      <div className="rounded-lg bg-muted/30 border px-4 py-2.5">
        <span className="text-sm font-medium">
          Payroll Report: {MONTHS[selectedMonth - 1]} {selectedYear}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Employees", value: summary.employeeCount, icon: Users, color: "bg-blue-500" },
          { label: "Total Basic", value: formatCurrency(summary.totalBasic), icon: Banknote, color: "bg-violet-500" },
          { label: "Allowances", value: formatCurrency(summary.totalAllowances), icon: TrendingUp, color: "bg-emerald-500" },
          { label: "Deductions", value: formatCurrency(summary.totalDeductions), icon: TrendingDown, color: "bg-red-500" },
          { label: "Net Payroll", value: formatCurrency(summary.totalNet), icon: DollarSign, color: "bg-teal-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color} mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-lg font-bold font-display">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{card.label}</p>
            </div>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16">
          <p className="font-medium text-muted-foreground">
            No payroll records for {MONTHS[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {[
                    "#", "Emp ID", "Name", "Department", "Designation",
                    "Basic Salary", "Allowances", "Deductions", "Net Salary",
                    "Method", "Paid Date",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.employeeId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.employeeId}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.name}</td>
                    <td className="px-3 py-2.5">{row.department}</td>
                    <td className="px-3 py-2.5">{row.designation}</td>
                    <td className="px-3 py-2.5">{formatCurrency(row.basicSalary)}</td>
                    <td className="px-3 py-2.5 text-emerald-600">
                      {row.allowances > 0 ? `+${formatCurrency(row.allowances)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-red-600">
                      {row.deductions > 0 ? `-${formatCurrency(row.deductions)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-primary">
                      {formatCurrency(row.netSalary)}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{row.paymentMethod ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      {row.paidDate ? formatDate(row.paidDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30 font-semibold text-xs">
                  <td colSpan={5} className="px-3 py-2.5 text-muted-foreground">TOTALS</td>
                  <td className="px-3 py-2.5">{formatCurrency(summary.totalBasic)}</td>
                  <td className="px-3 py-2.5 text-emerald-600">+{formatCurrency(summary.totalAllowances)}</td>
                  <td className="px-3 py-2.5 text-red-600">-{formatCurrency(summary.totalDeductions)}</td>
                  <td className="px-3 py-2.5 text-primary">{formatCurrency(summary.totalNet)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}