"use client";

import type { StudentReportRow } from "@/features/reports/actions/report.actions";
import { formatDate } from "@/lib/utils";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX } from "lucide-react";

interface StudentReportProps {
  data: StudentReportRow[];
  classes: { id: string; displayName: string }[];
}

function exportCSV(data: StudentReportRow[]) {
  const headers = [
    "Adm #", "Name", "Gender", "Date of Birth", "Class", "Section",
    "Roll #", "Phone", "Email", "Parent Name", "Parent Phone",
    "Admission Date", "Status",
  ];
  const rows = data.map((r) => [
    r.admissionNumber, r.name, r.gender,
    formatDate(r.dateOfBirth), r.className, r.sectionName,
    r.rollNumber ?? "—", r.phone ?? "—", r.email,
    r.parentName, r.parentPhone,
    formatDate(r.admissionDate), r.isActive ? "Active" : "Inactive",
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `student-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StudentReport({ data, classes }: StudentReportProps) {
  const active = data.filter((s) => s.isActive).length;
  const inactive = data.filter((s) => !s.isActive).length;
  const male = data.filter((s) => s.gender === "MALE").length;
  const female = data.filter((s) => s.gender === "FEMALE").length;

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
            key: "gender",
            label: "Gender",
            type: "select",
            options: [
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ],
          },
          {
            key: "isActive",
            label: "Status",
            type: "select",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
        ]}
        onExportCSV={() => exportCSV(data)}
        onPrint={() => window.print()}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: data.length, icon: Users, color: "bg-blue-500" },
          { label: "Active", value: active, icon: UserCheck, color: "bg-emerald-500" },
          { label: "Inactive", value: inactive, icon: UserX, color: "bg-red-500" },
          { label: "Male / Female", value: `${male} / ${female}`, icon: Users, color: "bg-violet-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color} mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold font-display">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{card.label}</p>
            </div>
          );
        })}
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-muted-foreground">No students found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {[
                    "#", "Adm #", "Name", "Gender", "DOB", "Class",
                    "Sec", "Roll #", "Phone", "Parent", "Parent Ph.",
                    "Adm Date", "Status",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.admissionNumber} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.admissionNumber}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.name}</td>
                    <td className="px-3 py-2.5 capitalize text-xs">{row.gender.toLowerCase()}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{formatDate(row.dateOfBirth)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{row.className}</td>
                    <td className="px-3 py-2.5">{row.sectionName}</td>
                    <td className="px-3 py-2.5">{row.rollNumber ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{row.phone ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{row.parentName}</td>
                    <td className="px-3 py-2.5 text-xs">{row.parentPhone}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{formatDate(row.admissionDate)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={row.isActive ? "default" : "secondary"} className="text-[10px]">
                        {row.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}