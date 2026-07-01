import type { Metadata } from "next";
import { getClasses } from "@/features/classes/actions/class.actions";
import { ClassTable } from "@/features/classes/components/class-table";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Manage classes and their sections
          </p>
        </div>
      </div>
      <ClassTable classes={classes} />
    </div>
  );
}