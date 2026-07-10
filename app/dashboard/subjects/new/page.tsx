import type { Metadata } from "next";
import { SubjectForm } from "@/features/subjects/components/subject-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Add Subject" };

export default async function NewSubjectPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!["PRINCIPAL", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/subjects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Subject</h1>
          <p className="text-sm text-muted-foreground">Create a new subject</p>
        </div>
      </div>
      <SubjectForm />
    </div>
  );
}