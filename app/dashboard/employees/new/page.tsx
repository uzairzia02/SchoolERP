import type { Metadata } from "next";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Add Employee" };

export default function NewEmployeePage() {
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Employee</h1>
          <p className="text-sm text-muted-foreground">
            Add a new non-teaching staff member
          </p>
        </div>
      </div>
      <EmployeeForm />
    </div>
  );
}