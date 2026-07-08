import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/features/settings/actions/settings.actions";
import { UserManagement } from "@/features/settings/components/user-management";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "User Accounts" };

export default async function UsersSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PRINCIPAL") {
    redirect("/dashboard/settings");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">User Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage system access and passwords</p>
        </div>
      </div>
      <UserManagement users={users as any} currentUserId={session.user.id} />
    </div>
  );
}