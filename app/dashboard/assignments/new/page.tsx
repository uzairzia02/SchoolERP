import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AssignmentForm } from "@/features/assignments/components/assignment-form";

export const metadata: Metadata = { title: "New Assignment" };

export default async function NewAssignmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["TEACHER", "FACULTY"].includes(session.user.role)) redirect("/dashboard/assignments");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Assignment</h1>
        <p className="text-sm text-muted-foreground">Create a new assignment for your class.</p>
      </div>

      <AssignmentForm mode="create" />
    </div>
  );
}
