import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClasses } from "@/features/classes/actions/class.actions";
import { ClassTable } from "@/features/classes/components/class-table";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Classes" };

const ADMIN_ROLES = ["SUPER_ADMIN", "PRINCIPAL"];

export default async function ClassesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canEdit = ADMIN_ROLES.includes(session.user.role);
  const isTeacher = ["TEACHER", "FACULTY"].includes(session.user.role);

  const classes = await getClasses();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">
            {isTeacher ? "My Classes" : "Classes"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? "Classes you teach" : "Manage classes and their sections"}
          </p>
        </div>
      </div>
      <ClassTable classes={classes} canEdit={canEdit} />
    </div>
  );
}