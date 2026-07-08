import type { Metadata } from "next";
import { RolesPermissions } from "@/features/settings/components/roles-permissions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default function RolesSettingsPage() {
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Permission matrix for all system roles
          </p>
        </div>
      </div>
      <RolesPermissions />
    </div>
  );
}