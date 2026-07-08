import type { Metadata } from "next";
import { getGradeScales } from "@/features/settings/actions/settings.actions";
import { GradingSettings } from "@/features/settings/components/grading-settings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Grading System" };

export default async function GradingSettingsPage() {
  const gradeScales = await getGradeScales();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Grading System</h1>
          <p className="text-sm text-muted-foreground">
            Configure grade scales and GPA — A+ to F
          </p>
        </div>
      </div>
      <GradingSettings gradeScales={gradeScales} />
    </div>
  );
}