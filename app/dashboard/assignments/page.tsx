import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAssignments } from "@/features/assignments/actions/assignment.actions";
import { AssignmentTable } from "@/features/assignments/components/assignment-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Assignments" };

const ALLOWED_ROLES = ["TEACHER", "FACULTY", "PRINCIPAL", "SUPER_ADMIN"];

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/login");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;

  const result = await getAssignments({ page, pageSize: 10, search: params.search });
  const canCreate = ["TEACHER", "FACULTY"].includes(session.user.role);
  const isAdmin = ["PRINCIPAL", "SUPER_ADMIN"].includes(session.user.role);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {canCreate ? "Manage your assignments and review submissions." : "School-wide assignment oversight."}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/assignments/new">
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Link>
          </Button>
        )}
      </div>

      <AssignmentTable data={result?.assignments ?? []} showTeacherColumn={isAdmin} />
    </div>
  );
}
