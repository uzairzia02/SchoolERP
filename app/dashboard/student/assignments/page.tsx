import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAssignments } from "@/features/assignments/actions/assignment.actions";
import { StudentAssignmentList } from "@/features/assignments/components/student-assignment-list";

export const metadata: Metadata = { title: "My Assignments" };

export default async function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;

  const result = await getAssignments({ page, pageSize: 20 });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Assignments</h1>
        <p className="text-sm text-muted-foreground">View and submit your homework.</p>
      </div>

      <StudentAssignmentList data={result?.assignments ?? []} />
    </div>
  );
}
