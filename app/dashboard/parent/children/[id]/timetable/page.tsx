import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getChildTimetable } from "@/features/parents/actions/child-timetable.actions";
import { Calendar } from "lucide-react";

export const metadata: Metadata = { title: "Child Timetable" };

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

export default async function ChildTimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const { id } = await params;
  const data = await getChildTimetable(id);

  if (!data) notFound();

  const days = Object.keys(DAY_LABELS).filter((d) => data.timetable[d]?.length > 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.studentName}&apos;s Timetable</h1>
        <p className="text-sm text-muted-foreground">
          {data.className}{data.sectionName ? ` - ${data.sectionName}` : ""}
        </p>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No timetable has been set up yet.
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day} className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {DAY_LABELS[day]}
              </h2>
              <div className="space-y-2">
                {data.timetable[day].map((slot, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{slot.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {slot.teacher} • Room {slot.room}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{slot.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
