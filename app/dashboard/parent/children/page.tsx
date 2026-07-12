import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getParentChildrenList } from "@/features/parents/actions/children-list.actions";
import { Users, BookOpen, Wallet, ClipboardCheck, Calendar } from "lucide-react";

export const metadata: Metadata = { title: "My Children" };

export default async function ParentChildrenPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const children = await getParentChildrenList();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Children</h1>
        <p className="text-sm text-muted-foreground">Select a child to view their records.</p>
      </div>

      {!children || children.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No children linked to this account.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <div key={child.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{child.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {child.className} - {child.sectionName} • {child.relation}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  href={`/dashboard/parent/children/${child.id}/grades`}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="text-xs">Results</span>
                </Link>
                <Link
                  href={`/dashboard/parent/children/${child.id}/fees`}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <Wallet className="h-4 w-4 text-red-600" />
                  <span className="text-xs">Fees</span>
                </Link>
                <Link
                  href={`/dashboard/parent/children/${child.id}/attendance`}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs">Attendance</span>
                </Link>
                <Link
                  href={`/dashboard/parent/children/${child.id}/timetable`}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-xs">Timetable</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
