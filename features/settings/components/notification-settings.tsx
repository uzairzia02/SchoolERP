"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, MessageSquare, Info } from "lucide-react";
import { z } from "zod";
import { updateNotificationSettingsAction } from "@/features/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  smsApiKey: z.string().optional(),
  smsApiUrl: z.string().optional(),
  smsMasking: z.string().optional(),
  smsAbsentTemplate: z.string().optional(),
  smsFeeTemplate: z.string().optional(),
  smsResultTemplate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface NotificationSettingsProps {
  settings: {
    smsApiKey: string | null;
    smsApiUrl: string | null;
    smsMasking: string | null;
    smsAbsentTemplate: string | null;
    smsFeeTemplate: string | null;
    smsResultTemplate: string | null;
  };
}

const DEFAULT_TEMPLATES = {
  absent: "Dear Parent, your child {student_name} was absent on {date}. Please contact school for details. - {school_name}",
  fee: "Dear Parent, fee of PKR {amount} for {student_name} is due on {due_date}. Please pay at school. - {school_name}",
  result: "Dear Parent, {student_name} scored {percentage}% ({grade}) in {exam_name}. - {school_name}",
};

export function NotificationSettings({ settings }: NotificationSettingsProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      smsApiKey: settings.smsApiKey ?? "",
      smsApiUrl: settings.smsApiUrl ?? "",
      smsMasking: settings.smsMasking ?? "",
      smsAbsentTemplate: settings.smsAbsentTemplate ?? "",
      smsFeeTemplate: settings.smsFeeTemplate ?? "",
      smsResultTemplate: settings.smsResultTemplate ?? "",
    },
  });

  async function onSubmit(values: FormData) {
    const result = await updateNotificationSettingsAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* SMS API Config */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold font-display">SMS Gateway Configuration</h3>
        </div>
        <div className="rounded-lg bg-blue-500/5 border border-blue-200 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Compatible with ZONG, Telenor, Jazz SMS APIs and other Pakistan-based SMS gateways.
            Contact your SMS provider for API credentials.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>SMS API URL</Label>
            <Input
              {...register("smsApiUrl")}
              placeholder="https://api.smsprovider.pk/send"
            />
          </div>
          <div className="space-y-1.5">
            <Label>API Key / Token</Label>
            <Input
              type="password"
              {...register("smsApiKey")}
              placeholder="Your API key"
            />
          </div>
          <div className="space-y-1.5">
            <Label>SMS Masking / Sender ID</Label>
            <Input
              {...register("smsMasking")}
              placeholder="SCHOOL-ERP"
            />
          </div>
        </div>
      </div>

      {/* SMS Templates */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h3 className="font-semibold font-display">SMS Templates</h3>
        <p className="text-xs text-muted-foreground">
          Variables: {"{student_name}"}, {"{date}"}, {"{amount}"}, {"{due_date}"},{" "}
          {"{grade}"}, {"{percentage}"}, {"{exam_name}"}, {"{school_name}"}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Absent Alert Template</Label>
            <button
              type="button"
              onClick={() => setValue("smsAbsentTemplate", DEFAULT_TEMPLATES.absent, { shouldDirty: true })}
              className="text-xs text-primary hover:underline"
            >
              Use default
            </button>
          </div>
          <textarea
            {...register("smsAbsentTemplate")}
            rows={3}
            placeholder={DEFAULT_TEMPLATES.absent}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Fee Reminder Template</Label>
            <button
              type="button"
              onClick={() => setValue("smsFeeTemplate", DEFAULT_TEMPLATES.fee, { shouldDirty: true })}
              className="text-xs text-primary hover:underline"
            >
              Use default
            </button>
          </div>
          <textarea
            {...register("smsFeeTemplate")}
            rows={3}
            placeholder={DEFAULT_TEMPLATES.fee}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Result Announcement Template</Label>
            <button
              type="button"
              onClick={() => setValue("smsResultTemplate", DEFAULT_TEMPLATES.result, { shouldDirty: true })}
              className="text-xs text-primary hover:underline"
            >
              Use default
            </button>
          </div>
          <textarea
            {...register("smsResultTemplate")}
            rows={3}
            placeholder={DEFAULT_TEMPLATES.result}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Notification Settings
        </Button>
      </div>
    </form>
  );
}