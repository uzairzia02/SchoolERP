"use client";

import type { AttendanceReportRow } from "@/features/reports/actions/report.actions";
import { formatDate } from "@/lib/utils";
import { ReportFilters } from "@/features/reports/components/report-filters";
import {
  UserCheck, UserX, Clock, Users, TrendingUp,
} from "lucide-react";

interface AttendanceReportProps {
  data: AttendanceReportRow[];
  classes: { id: string; displayName: string }[];
  params: {
    classId?: string;
    sectionId?: string;
    startDate: string;
    endDate: string;
  };
}

function exportCSV(data: AttendanceReportRow[], startDate: string, endDate: string) {
  const headers = [
    "Admission #", "Name", "Class", "Section", "Roll #",
    "Total Days", "Present", "Absent", "Late", "Half Day", "Leave", "Percentage",
  ];
  const rows = data.map((r) => [
    r.admissionNumber, r.name, r.className, r.sectionName,
    r.rollNumber ?? "—", r.totalDays, r.present, r.absent,
    r.late, r.halfDay, r.leave, `${r.percentage}%`,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AttendanceReport({
  data,
  classes,
  params,
}: AttendanceReportProps) {
  // Summary
  const totalPresent = data.reduce((s, r) => s + r.present, 0);
  const totalAbsent = data.reduce((s, r) => s + r.absent, 0);
  const totalLate = data.reduce((s, r) => s + r.late, 0);
  const totalDays = data.reduce((s, r) => s + r.totalDays, 0);
  const avgPercentage =
    data.length > 0
      ? Math.round(data.reduce((s, r) => s + r.percentage, 0) / data.length)
      : 0;

  const lowAttendance = data.filter((r) => r.percentage < 75).length;

  return (
    <div className="space-y-6">
      <ReportFilters
        fields={[
          {
            key: "startDate",
            label: "Start Date",
            type: "date",
          },
          {
            key: "endDate",
            label: "End Date",
            type: "date",
          },
          {
            key: "classId",
            label: "Class",
            type: "select",
            options: classes.map((c) => ({ value: c.id, label: c.displayName })),
          },
          {
            key: "status",
            label: "Attendance",
            type: "select",
            options: [
              { value: "low", label: "Low (<75%)" },
              { value: "good", label: "Good (≥75%)" },
            ],
          },
        ]}
        onExportCSV={() => exportCSV(data, params.startDate, params.endDate)}
        onPrint={() => window.print()}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Students", value: data.length, icon: Users, color: "bg-blue-500" },
          { label: "Avg Attendance", value: `${avgPercentage}%`, icon: TrendingUp, color: "bg-violet-500" },
          { label: "Total Present", value: totalPresent, icon: UserCheck, color: "bg-emerald-500" },
          { label: "Total Absent", value: totalAbsent, icon: UserX, color: "bg-red-500" },
          { label: "Total Late", value: totalLate, icon: Clock, color: "bg-yellow-500" },
          { label: "Low Attendance", value: lowAttendance, icon: UserX, color: "bg-orange-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color} mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold font-display">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Date Range Info */}
      <div className="rounded-lg bg-muted/30 border px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Report Period: <span className="font-medium text-foreground">{formatDate(params.startDate)}</span> to <span className="font-medium text-foreground">{formatDate(params.endDate)}</span>
        </span>
        <span className="text-sm text-muted-foreground">
          {data.length} students
        </span>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-muted-foreground">No data found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adjust filters to see attendance data
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {[
                    "#", "Adm #", "Student Name", "Class", "Section",
                    "Roll #", "Days", "Present", "Absent", "Late",
                    "Half Day", "Leave", "Attendance %",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.studentId}
                    className={`border-b last:border-0 transition-colors ${
                      row.percentage < 75
                        ? "bg-red-500/5 hover:bg-red-500/10"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.admissionNumber}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.name}</td>
                    <td className="px-3 py-2.5">{row.className}</td>
                    <td className="px-3 py-2.5">{row.sectionName}</td>
                    <td className="px-3 py-2.5">{row.rollNumber ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center">{row.totalDays}</td>
                    <td className="px-3 py-2.5 text-center text-emerald-600 font-medium">{row.present}</td>
                    <td className="px-3 py-2.5 text-center text-red-600 font-medium">{row.absent}</td>
                    <td className="px-3 py-2.5 text-center text-yellow-600 font-medium">{row.late}</td>
                    <td className="px-3 py-2.5 text-center text-orange-600 font-medium">{row.halfDay}</td>
                    <td className="px-3 py-2.5 text-center text-blue-600 font-medium">{row.leave}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.percentage >= 75 ? "bg-emerald-500" : "bg-red-500"
                            }`}
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold whitespace-nowrap ${
                          row.percentage >= 75 ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {row.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals Row */}
              <tfoot>
                <tr className="border-t bg-muted/30 font-semibold">
                  <td colSpan={6} className="px-3 py-2.5 text-xs text-muted-foreground">
                    TOTALS
                  </td>
                  <td className="px-3 py-2.5 text-center">{totalDays}</td>
                  <td className="px-3 py-2.5 text-center text-emerald-600">{totalPresent}</td>
                  <td className="px-3 py-2.5 text-center text-red-600">{totalAbsent}</td>
                  <td className="px-3 py-2.5 text-center text-yellow-600">{totalLate}</td>
                  <td className="px-3 py-2.5 text-center" />
                  <td className="px-3 py-2.5 text-center" />
                  <td className="px-3 py-2.5 text-xs font-bold text-primary">{avgPercentage}% avg</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}