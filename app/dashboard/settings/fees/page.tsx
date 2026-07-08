import type { Metadata } from "next";
import { getSchoolSettings } from "@/features/settings/actions/settings.actions";
import { FeeSettings } from "@/features/settings/components/fee-settings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Fee Settings" };

export default async function FeeSettingsPage() {
  const { settings } = await getSchoolSettings();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Fee & Finance Settings</h1>
          <p className="text-sm text-muted-foreground">Bank details and examination configuration</p>
        </div>
      </div>
      <FeeSettings
        settings={{
          bankName: settings.bankName,
          bankAccountNumber: settings.bankAccountNumber,
          bankBranch: settings.bankBranch,
          passingMarks: settings.passingMarks,
        }}
      />
    </div>
  );
}