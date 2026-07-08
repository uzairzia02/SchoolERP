import type { Metadata } from "next";
import { getSchoolSettings } from "@/features/settings/actions/settings.actions";
import { SchoolProfileForm } from "@/features/settings/components/school-profile-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "School Profile" };

export default async function SchoolSettingsPage() {
  const { school } = await getSchoolSettings();
  if (!school) return null;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">School Profile</h1>
          <p className="text-sm text-muted-foreground">Update school information</p>
        </div>
      </div>
      <SchoolProfileForm school={school} />
    </div>
  );
}