import type { Metadata } from "next";
import { TeacherForm } from "@/features/teachers/components/teacher-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Add Teacher" };

export default function NewTeacherPage() {
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/teachers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Teacher</h1>
          <p className="text-sm text-muted-foreground">Add a new teaching staff member</p>
        </div>
      </div>
      <TeacherForm />
    </div>
  );
}