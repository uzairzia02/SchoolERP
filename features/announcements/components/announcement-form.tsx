"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Megaphone } from "lucide-react";
import { z } from "zod";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/features/announcements/actions/announcement.actions";
import type { AnnouncementListItem } from "@/features/announcements/actions/announcement.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/constants/enums";
import type { UserRole } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  targetRoles: z.array(z.string()).min(1, "Select at least one audience"),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN", "PRINCIPAL", "HR", "ACCOUNTANT",
  "TEACHER", "FACULTY", "STUDENT", "PARENT",
];

const ROLE_GROUPS = [
  {
    label: "Administration",
    roles: ["SUPER_ADMIN", "PRINCIPAL", "HR", "ACCOUNTANT"] as UserRole[],
  },
  {
    label: "Teaching Staff",
    roles: ["TEACHER", "FACULTY"] as UserRole[],
  },
  {
    label: "Students & Parents",
    roles: ["STUDENT", "PARENT"] as UserRole[],
  },
];

interface AnnouncementFormProps {
  announcement?: AnnouncementListItem;
}

export function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const isEdit = !!announcement;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: announcement?.title ?? "",
      content: announcement?.content ?? "",
      targetRoles: announcement?.targetRoles ?? [],
      isActive: announcement?.isActive ?? true,
    },
  });

  const selectedRoles = watch("targetRoles") ?? [];

  function toggleRole(role: string) {
    const current = selectedRoles;
    if (current.includes(role)) {
      setValue("targetRoles", current.filter((r) => r !== role), {
        shouldValidate: true,
      });
    } else {
      setValue("targetRoles", [...current, role], { shouldValidate: true });
    }
  }

  function selectAll() {
    if (selectedRoles.length === ALL_ROLES.length) {
      setValue("targetRoles", [], { shouldValidate: true });
    } else {
      setValue("targetRoles", ALL_ROLES as string[], { shouldValidate: true });
    }
  }

  function selectGroup(roles: UserRole[]) {
    const allSelected = roles.every((r) => selectedRoles.includes(r));
    if (allSelected) {
      setValue(
        "targetRoles",
        selectedRoles.filter((r) => !roles.includes(r as UserRole)),
        { shouldValidate: true }
      );
    } else {
      const merged = Array.from(new Set([...selectedRoles, ...roles]));
      setValue("targetRoles", merged, { shouldValidate: true });
    }
  }

  async function onSubmit(values: FormData) {
    const result = isEdit
      ? await updateAnnouncementAction({ ...values, id: announcement.id })
      : await createAnnouncementAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FormData, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Saved.");
    router.push("/dashboard/announcements");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Content */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold font-display">Announcement Content</h3>
        </div>

        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input
            placeholder="e.g. School closed on Friday due to annual sports day"
            {...register("title")}
            className={cn(errors.title && "border-destructive")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Content *</Label>
          <textarea
            {...register("content")}
            placeholder="Write your announcement here..."
            rows={6}
            className={cn(
              "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
              errors.content && "border-destructive"
            )}
          />
          {errors.content && (
            <p className="text-xs text-destructive">{errors.content.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("isActive")}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">Publish immediately (make visible to selected audience)</span>
        </label>
      </div>

      {/* Target Audience */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display">Target Audience</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Who should see this announcement?
            </p>
          </div>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            {selectedRoles.length === ALL_ROLES.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {errors.targetRoles && (
          <p className="text-xs text-destructive">{errors.targetRoles.message}</p>
        )}

        <div className="space-y-4">
          {ROLE_GROUPS.map((group) => {
            const allInGroup = group.roles.every((r) => selectedRoles.includes(r));
            return (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectGroup(group.roles)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {allInGroup ? "Deselect" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {group.roles.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left",
                          isSelected
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-accent text-muted-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full border-2 shrink-0 transition-colors",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          )}
                        />
                        {USER_ROLE_LABELS[role]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedRoles.length > 0 && (
          <div className="rounded-lg bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              This announcement will be visible to:{" "}
              <span className="font-medium text-foreground">
                {selectedRoles.map((r) => USER_ROLE_LABELS[r as UserRole]).join(", ")}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/announcements")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Update Announcement" : "Publish Announcement"}
        </Button>
      </div>
    </form>
  );
}