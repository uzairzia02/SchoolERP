import type { Metadata } from "next";
import { getEmployees } from "@/features/employees/actions/employee.actions";
import { EmployeeTable } from "@/features/employees/components/employee-table";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = { title: "Employees" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    departmentId?: string;
  }>;
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getEmployees({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    departmentId: params.departmentId,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
          <Briefcase className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage non-teaching staff
          </p>
        </div>
      </div>
      <EmployeeTable initialData={data} />
    </div>
  );
}