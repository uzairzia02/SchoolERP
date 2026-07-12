import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnnouncements } from "@/features/announcements/actions/announcement.actions";
import { AnnouncementList } from "@/features/announcements/components/announcement-list";
import type { UserRole } from "@prisma/client";

export const metadata: Metadata = { title: "Announcements" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    isActive?: string;
  }>;
}

const CAN_MANAGE_ROLES: UserRole[] = [
  "SUPER_ADMIN", "PRINCIPAL", "HR",
];

export default async function AnnouncementsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const canManage = CAN_MANAGE_ROLES.includes(session.user.role as UserRole);

  const data = await getAnnouncements({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    // Non-managers can NEVER see hidden announcements, regardless of what
    // they pass in the URL — force isActive: true for them server-side.
    // Only managers may toggle between all/published/hidden.
    isActive: canManage
      ? params.isActive === "true"
        ? true
        : params.isActive === "false"
        ? false
        : undefined
      : true,
    // Non-managers only see announcements targeted at their role
    role: canManage ? undefined : (session.user.role as UserRole),
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
          <Megaphone className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Create and manage school-wide announcements"
              : "School announcements for you"}
          </p>
        </div>
      </div>

      <AnnouncementList initialData={data} canManage={canManage} />
    </div>
  );
}
