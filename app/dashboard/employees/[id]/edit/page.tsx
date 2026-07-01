import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/features/employees/actions/employee.actions";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Employee" };

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getEmployeeById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/employees/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Employee</h1>
          <p className="text-sm text-muted-foreground">
            Update employee information
          </p>
        </div>
      </div>
      <EmployeeForm employee={result.data} />
    </div>
  );
}