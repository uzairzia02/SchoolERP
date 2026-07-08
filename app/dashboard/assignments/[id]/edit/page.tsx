import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getAssignmentById } from "@/features/assignments/actions/assignment.actions";
import { AssignmentForm } from "@/features/assignments/components/assignment-form";

export const metadata: Metadata = { title: "Edit Assignment" };

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["TEACHER", "FACULTY", "PRINCIPAL", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard/assignments");
  }

  const { id } = await params;
  const assignment = await getAssignmentById(id);

  if (!assignment) notFound();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Assignment</h1>
        <p className="text-sm text-muted-foreground">Update assignment details.</p>
      </div>

      <AssignmentForm
        mode="edit"
        initialData={{
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          subjectId: assignment.subjectId,
          classId: assignment.classId ?? "",
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          attachments: assignment.attachments,
        }}
      />
    </div>
  );
}
