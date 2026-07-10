import type { Metadata } from "next";
import { AdmissionForm } from "@/features/admissions/components/admission-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "New Application" };

export default async function NewAdmissionPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!["PRINCIPAL", "HR", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/admissions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">New Admission Application</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the applicant details
          </p>
        </div>
      </div>
      <AdmissionForm />
    </div>
  );
}