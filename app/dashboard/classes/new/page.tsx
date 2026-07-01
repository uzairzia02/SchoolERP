import type { Metadata } from "next";
import { ClassForm } from "@/features/classes/components/class-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Add Class" };

export default function NewClassPage() {
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/classes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Class</h1>
          <p className="text-sm text-muted-foreground">Create a new class</p>
        </div>
      </div>
      <ClassForm />
    </div>
  );
}