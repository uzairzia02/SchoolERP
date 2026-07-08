import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AssignmentDetail } from "@/features/assignments/components/assignment-detail";

export const metadata: Metadata = { title: "Assignment Details" };

const ALLOWED_ROLES = ["TEACHER", "FACULTY", "PRINCIPAL", "SUPER_ADMIN"];

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/login");

  const { id } = await params;

  return (
    <div className="p-4 md:p-6">
      <AssignmentDetail id={id} />
    </div>
  );
}
