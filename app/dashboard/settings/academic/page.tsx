import type { Metadata } from "next";
import {
  getSchoolSettings,
  getTerms,
  getHouses,
} from "@/features/settings/actions/settings.actions";
import { AcademicSettings } from "@/features/settings/components/academic-settings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Academic Settings" };

export default async function AcademicSettingsPage() {
  const [{ settings }, terms, houses] = await Promise.all([
    getSchoolSettings(),
    getTerms(),
    getHouses(),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Academic Settings</h1>
          <p className="text-sm text-muted-foreground">Session, terms, houses/groups</p>
        </div>
      </div>
      <AcademicSettings settings={settings} terms={terms} houses={houses} />
    </div>
  );
}