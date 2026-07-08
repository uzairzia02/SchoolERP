import type { DepartmentDetail } from "@/features/departments/actions/department.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, GraduationCap, Tag, Pencil,
} from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { DesignationFormDialog } from "@/features/departments/components/designation-form-dialog";

interface DepartmentDetailProps {
  department: DepartmentDetail;
}

export function DepartmentDetailView({ department }: DepartmentDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">{department.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {department.code}
                </span>
                <Badge variant={department.isActive ? "default" : "secondary"}>
                  {department.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {department.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {department.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Teachers", value: department._count.teachers, icon: GraduationCap, color: "bg-emerald-500" },
          { label: "Employees", value: department._count.employees, icon: Users, color: "bg-orange-500" },
          { label: "Designations", value: department._count.designations, icon: Tag, color: "bg-violet-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mx-auto mb-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Designations */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">Designations</h3>
            </div>
            <DesignationFormDialog defaultDepartmentId={department.id} />
          </div>

          {department.designations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No designations in this department
            </p>
          ) : (
            <div className="space-y-2">
              {department.designations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {d._count.teachers + d._count.employees} staff
                    </span>
                    <Badge
                      variant={d.isActive ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff */}
        <div className="space-y-4">
          {/* Teachers */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">
                Teachers ({department._count.teachers})
              </h3>
            </div>
            {department.teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                No teachers assigned
              </p>
            ) : (
              <div className="space-y-2">
                {department.teachers.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/teachers/${t.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                      {getInitials(`${t.firstName} ${t.lastName}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.firstName} {t.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.designation?.name ?? "—"} · {t.employeeId}
                      </p>
                    </div>
                  </Link>
                ))}
                {department._count.teachers > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{department._count.teachers - 20} more teachers
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Employees */}
          {department._count.employees > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold font-display text-sm">
                  Employees ({department._count.employees})
                </h3>
              </div>
              <div className="space-y-2">
                {department.employees.map((e) => (
                  <Link
                    key={e.id}
                    href={`/dashboard/employees/${e.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-600">
                      {getInitials(`${e.firstName} ${e.lastName}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {e.firstName} {e.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.designation?.name ?? "—"} · {e.employeeId}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}