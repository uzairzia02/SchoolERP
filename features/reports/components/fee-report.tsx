"use client";

import type {
  FeeReportRow,
  FeeSummaryData,
} from "@/features/reports/actions/report.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ReportFilters } from "@/features/reports/components/report-filters";
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, Tag, TrendingUp,
} from "lucide-react";

interface FeeReportProps {
  rows: FeeReportRow[];
  summary: FeeSummaryData;
  classes: { id: string; displayName: string }[];
  feeTypes: { id: string; name: string }[];
}

function exportCSV(rows: FeeReportRow[]) {
  const headers = [
    "Adm #", "Student Name", "Class", "Fee Type",
    "Amount", "Discount", "Fine", "Net Amount",
    "Paid Amount", "Balance", "Due Date", "Paid Date",
    "Status", "Payment Method", "Receipt #",
  ];
  const data = rows.map((r) => [
    r.admissionNumber, r.studentName, r.className, r.feeType,
    r.amount, r.discount, r.fine, r.netAmount,
    r.paidAmount, r.balance,
    formatDate(r.dueDate), r.paidDate ? formatDate(r.paidDate) : "—",
    r.status, r.paymentMethod ?? "—", r.receiptNumber ?? "—",
  ]);

  const csv = [headers, ...data].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fee-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "text-emerald-600",
  UNPAID: "text-yellow-600",
  PARTIAL: "text-blue-600",
  OVERDUE: "text-red-600",
  WAIVED: "text-gray-500",
};

export function FeeReport({ rows, summary, classes, feeTypes }: FeeReportProps) {
  return (
    <div className="space-y-6">
      <ReportFilters
        fields={[
          {
            key: "classId",
            label: "Class",
            type: "select",
            options: classes.map((c) => ({ value: c.id, label: c.displayName })),
          },
          {
            key: "feeTypeId",
            label: "Fee Type",
            type: "select",
            options: feeTypes.map((f) => ({ value: f.id, label: f.name })),
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "PAID", label: "Paid" },
              { value: "UNPAID", label: "Unpaid" },
              { value: "PARTIAL", label: "Partial" },
              { value: "OVERDUE", label: "Overdue" },
            ],
          },
          {
            key: "startDate",
            label: "Due From",
            type: "date",
          },
        ]}
        onExportCSV={() => exportCSV(rows)}
        onPrint={() => window.print()}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Assigned", value: formatCurrency(summary.totalAssigned), icon: CreditCard, color: "bg-blue-500" },
          { label: "Collected", value: formatCurrency(summary.totalCollected), icon: CheckCircle, color: "bg-emerald-500" },
          { label: "Pending", value: formatCurrency(summary.totalPending), icon: Clock, color: "bg-yellow-500" },
          { label: "Overdue", value: summary.overdueCount, icon: AlertTriangle, color: "bg-red-500" },
          { label: "Discounts", value: formatCurrency(summary.totalDiscount), icon: Tag, color: "bg-violet-500" },
          {
            label: "Collection Rate",
            value: summary.totalAssigned > 0
              ? `${Math.round((summary.totalCollected / summary.totalAssigned) * 100)}%`
              : "0%",
            icon: TrendingUp,
            color: "bg-teal-500",
          },
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
          <p className="font-medium text-muted-foreground">No fee records found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {[
                    "#", "Adm #", "Student", "Class", "Fee Type",
                    "Amount", "Disc.", "Fine", "Net", "Paid",
                    "Balance", "Due Date", "Paid Date", "Status",
                    "Method", "Receipt #",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b last:border-0 hover:bg-muted/20 ${row.status === "OVERDUE" ? "bg-red-500/5" : ""}`}>
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.admissionNumber}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.studentName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{row.className}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{row.feeType}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-2.5 text-emerald-600">
                      {row.discount > 0 ? `-${formatCurrency(row.discount)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-red-600">
                      {row.fine > 0 ? `+${formatCurrency(row.fine)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{formatCurrency(row.netAmount)}</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-medium">{formatCurrency(row.paidAmount)}</td>
                    <td className={`px-3 py-2.5 font-medium ${row.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(row.balance)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{formatDate(row.dueDate)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                      {row.paidDate ? formatDate(row.paidDate) : "—"}
                    </td>
                    <td className={`px-3 py-2.5 text-xs font-bold ${STATUS_COLORS[row.status] ?? ""}`}>
                      {row.status}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{row.paymentMethod ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.receiptNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30 font-semibold text-xs">
                  <td colSpan={5} className="px-3 py-2.5 text-muted-foreground">TOTALS</td>
                  <td className="px-3 py-2.5">{formatCurrency(rows.reduce((s, r) => s + r.amount, 0))}</td>
                  <td className="px-3 py-2.5 text-emerald-600">{formatCurrency(summary.totalDiscount)}</td>
                  <td className="px-3 py-2.5 text-red-600">{formatCurrency(summary.totalFine)}</td>
                  <td className="px-3 py-2.5">{formatCurrency(summary.totalAssigned)}</td>
                  <td className="px-3 py-2.5 text-emerald-600">{formatCurrency(summary.totalCollected)}</td>
                  <td className="px-3 py-2.5 text-red-600">{formatCurrency(summary.totalPending)}</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}