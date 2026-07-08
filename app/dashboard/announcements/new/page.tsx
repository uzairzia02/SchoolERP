import type { Metadata } from "next";
import { AnnouncementForm } from "@/features/announcements/components/announcement-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export const metadata: Metadata = { title: "New Announcement" };

export default async function NewAnnouncementPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canManage = ["SUPER_ADMIN", "PRINCIPAL", "HR"].includes(
    session.user.role as UserRole
  );

  if (!canManage) redirect("/dashboard/announcements");

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/announcements">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">New Announcement</h1>
          <p className="text-sm text-muted-foreground">
            Publish a school-wide announcement
          </p>
        </div>
      </div>
      <AnnouncementForm />
    </div>
  );
}