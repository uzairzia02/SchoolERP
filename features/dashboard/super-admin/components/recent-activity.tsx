import { formatDate } from "@/lib/utils";
import { GraduationCap, CalendarDays } from "lucide-react";

interface RecentActivityProps {
  recentStudents: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    createdAt: Date;
    class: { name: string } | null;
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    startDate: Date;
    location: string | null;
  }[];
}

export function RecentActivity({
  recentStudents,
  upcomingEvents,
}: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Recent Admissions */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold font-display">Recent Admissions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest enrolled students
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {recentStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No students yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add students to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.admissionNumber}
                    {student.class && ` · Class ${student.class.name}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(student.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold font-display">Upcoming Events</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled school events
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <CalendarDays className="h-4 w-4 text-violet-600" />
          </div>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schedule events to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const date = new Date(event.startDate);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-500/10 text-center">
                    <span className="text-[10px] font-semibold text-violet-600 uppercase">
                      {date.toLocaleString("default", { month: "short" })}
                    </span>
                    <span className="text-sm font-bold text-violet-700 leading-none">
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground truncate">
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}