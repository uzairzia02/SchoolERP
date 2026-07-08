import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentExams } from "@/features/exams/actions/student-exams.actions";
import { StudentExamList } from "@/features/exams/components/student-exam-list";

export const metadata: Metadata = { title: "My Examinations" };

export default async function StudentExamsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  const data = await getStudentExams();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Examinations</h1>
        <p className="text-sm text-muted-foreground">View your exam schedule and details.</p>
      </div>

      <StudentExamList exams={data?.exams ?? []} />
    </div>
  );
}
