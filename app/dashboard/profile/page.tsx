import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyProfile } from "@/features/profile/actions/profile.actions";
import { ProfileView } from "@/features/profile/components/profile-view";
import { User } from "lucide-react";
import { profile } from "console";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const result = await getMyProfile();
  if (!result.success) notFound();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your account information
          </p>
        </div>
      </div>
      <ProfileView profile={result.data} />
    </div>
  );
}