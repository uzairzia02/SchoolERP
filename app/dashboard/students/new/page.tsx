import type { Metadata } from "next";
import { StudentForm } from "@/features/students/components/student-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Add Student" };

export default async function NewStudentPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!["PRINCIPAL", "HR", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Student</h1>
          <p className="text-sm text-muted-foreground">
            Enroll a new student
          </p>
        </div>
      </div>
      <StudentForm />
    </div>
  );
}