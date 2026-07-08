import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2, Tag, Users, GraduationCap,
} from "lucide-react";
import { getDepartments } from "@/features/departments/actions/department.actions";
import { DepartmentTable } from "@/features/departments/components/department-table";
import { DepartmentFormDialog } from "@/features/departments/components/department-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  const totalTeachers = departments.reduce((s, d) => s + d._count.teachers, 0);
  const totalEmployees = departments.reduce((s, d) => s + d._count.employees, 0);
  const totalDesignations = departments.reduce((s, d) => s + d._count.designations, 0);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Departments</h1>
            <p className="text-sm text-muted-foreground">
              Manage school departments and organizational structure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/designations">
              <Tag className="h-4 w-4 mr-2" />
              Designations
            </Link>
          </Button>
          <DepartmentFormDialog />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Departments", value: departments.length, icon: Building2, color: "bg-blue-500" },
          { label: "Designations", value: totalDesignations, icon: Tag, color: "bg-violet-500" },
          { label: "Teachers", value: totalTeachers, icon: GraduationCap, color: "bg-emerald-500" },
          { label: "Employees", value: totalEmployees, icon: Users, color: "bg-orange-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-3`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <DepartmentTable departments={departments} />
    </div>
  );
}