import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentAssignmentDetail } from "@/features/assignments/components/student-assignment-detail";

export const metadata: Metadata = { title: "Assignment" };

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  const { id } = await params;

  return (
    <div className="p-4 md:p-6">
      <StudentAssignmentDetail id={id} />
    </div>
  );
}
