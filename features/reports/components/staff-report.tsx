"use client";

import type { StaffReportRow } from "@/features/reports/actions/report.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, GraduationCap, Briefcase } from "lucide-react";

interface StaffReportProps {
  data: StaffReportRow[];
  departments: { id: string; name: string }[];
}

function exportCSV(data: StaffReportRow[]) {
  const headers = [
    "Emp ID", "Name", "Type", "Gender", "Department", "Designation",
    "Email", "Phone", "Qualification", "Experience",
    "Joining Date", "Salary", "Status",
    "Last Working Date", "Leaving Reason",
  ];
  const rows = data.map((r) => [
    r.employeeId, r.name, r.type, r.gender,
    r.department, r.designation, r.email, r.phone,
    r.qualification ?? "—", r.experience ? `${r.experience} yrs` : "—",
    formatDate(r.joiningDate), r.salary ? formatCurrency(r.salary) : "—",
    r.isActive ? "Active" : "Inactive",
    r.lastWorkingDate ? formatDate(r.lastWorkingDate) : "—",
    r.leavingReason ?? "—",
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `staff-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StaffReport({ data, departments }: StaffReportProps) {
  const active = data.filter((s) => s.isActive).length;
  const inactive = data.filter((s) => !s.isActive).length;
  const teachers = data.filter((s) => s.type === "Teacher").length;
  const employees = data.filter((s) => s.type === "Employee").length;

  return (
    <div className="space-y-6">
      <ReportFilters
        fields={[
          {
            key: "type",
            label: "Staff Type",
            type: "select",
            options: [
              { value: "TEACHER", label: "Teachers" },
              { value: "EMPLOYEE", label: "Employees" },
            ],
          },
          {
            key: "departmentId",
            label: "Department",
            type: "select",
            options: departments.map((d) => ({ value: d.id, label: d.name })),
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
          { label: "Total Staff", value: data.length, icon: Users, color: "bg-blue-500" },
          { label: "Teachers", value: teachers, icon: GraduationCap, color: "bg-emerald-500" },
          { label: "Employees", value: employees, icon: Briefcase, color: "bg-orange-500" },
          { label: "Active / Inactive", value: `${active} / ${inactive}`, icon: UserCheck, color: "bg-violet-500" },
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
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16">
          <p className="font-medium text-muted-foreground">No staff found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {[
                    "#", "Emp ID", "Name", "Type", "Gender", "Department",
                    "Designation", "Email", "Phone", "Qualification",
                    "Exp.", "Joining", "Salary", "Status",
                    "Last Working", "Reason",
                  ].map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.employeeId}
                    className={`border-b last:border-0 hover:bg-muted/20 ${!row.isActive ? "bg-muted/10" : ""}`}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.employeeId}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.name}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={row.type === "Teacher" ? "default" : "secondary"} className="text-[10px]">
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 capitalize text-xs">{row.gender.toLowerCase()}</td>
                    <td className="px-3 py-2.5">{row.department}</td>
                    <td className="px-3 py-2.5">{row.designation}</td>
                    <td className="px-3 py-2.5 text-xs">{row.email}</td>
                    <td className="px-3 py-2.5 text-xs">{row.phone}</td>
                    <td className="px-3 py-2.5 text-xs">{row.qualification ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {row.experience ? `${row.experience}y` : "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{formatDate(row.joiningDate)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {row.salary ? formatCurrency(row.salary) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={row.isActive ? "default" : "secondary"} className="text-[10px]">
                        {row.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                      {row.lastWorkingDate ? formatDate(row.lastWorkingDate) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">
                      {row.leavingReason ?? "—"}
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