import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/features/employees/actions/employee.actions";
import { EmployeeDetailView } from "@/features/employees/components/employee-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getEmployeeById(id);
  if (!result.success) return { title: "Employee Not Found" };
  return { title: `${result.data.firstName} ${result.data.lastName}` };
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getEmployeeById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Employee Detail</h1>
          <p className="text-sm text-muted-foreground">
            View employee information
          </p>
        </div>
      </div>
      <EmployeeDetailView employee={result.data} />
    </div>
  );
}