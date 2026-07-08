import type { Metadata } from "next";
import { getSchoolSettings } from "@/features/settings/actions/settings.actions";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsSettingsPage() {
  const { settings } = await getSchoolSettings();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">SMS & Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Configure SMS gateway and message templates
          </p>
        </div>
      </div>
      <NotificationSettings
        settings={{
          smsApiKey: settings.smsApiKey,
          smsApiUrl: settings.smsApiUrl,
          smsMasking: settings.smsMasking,
          smsAbsentTemplate: settings.smsAbsentTemplate,
          smsFeeTemplate: settings.smsFeeTemplate,
          smsResultTemplate: settings.smsResultTemplate,
        }}
      />
    </div>
  );
}