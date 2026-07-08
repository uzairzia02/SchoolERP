"use client";

import type { WeeklyTimetable, TimetableSlot } from "@/features/timetable/actions/timetable.actions";
import { deleteTimetableSlotAction } from "@/features/timetable/actions/timetable.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Clock, MapPin, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@prisma/client";

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
];

const SUBJECT_COLORS = [
  "bg-blue-500/10 border-blue-200 text-blue-700",
  "bg-emerald-500/10 border-emerald-200 text-emerald-700",
  "bg-violet-500/10 border-violet-200 text-violet-700",
  "bg-orange-500/10 border-orange-200 text-orange-700",
  "bg-pink-500/10 border-pink-200 text-pink-700",
  "bg-teal-500/10 border-teal-200 text-teal-700",
  "bg-yellow-500/10 border-yellow-200 text-yellow-700",
  "bg-red-500/10 border-red-200 text-red-700",
];

interface TimetableGridProps {
  timetable: WeeklyTimetable;
  canEdit?: boolean;
  showTeacher?: boolean;
  showClass?: boolean;
}

export function TimetableGrid({
  timetable,
  canEdit = false,
  showTeacher = true,
  showClass = false,
}: TimetableGridProps) {
  const router = useRouter();

  // Build subject color map
  const subjectColorMap: Record<string, string> = {};
  let colorIndex = 0;
  Object.values(timetable)
    .flat()
    .forEach((slot) => {
      if (!subjectColorMap[slot.subject.id]) {
        subjectColorMap[slot.subject.id] =
          SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
        colorIndex++;
      }
    });

  const totalSlots = Object.values(timetable).flat().length;

  async function handleDelete(slot: TimetableSlot) {
    if (!confirm(`Remove ${slot.subject.name} from ${slot.dayOfWeek}?`)) return;
    const result = await deleteTimetableSlotAction(slot.id);
    if (result.success) {
      toast.success("Slot removed.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (totalSlots === 0) {
    return (
      <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No timetable configured yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add periods to build the weekly schedule
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label, short }) => {
        const slots = timetable[key] ?? [];
        if (slots.length === 0) return null;

        return (
          <div key={key} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xs font-bold text-primary">{short}</span>
              </div>
              <span className="text-sm font-semibold font-display">{label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {slots.length} period{slots.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={cn(
                    "relative rounded-xl border p-3 min-w-[160px] flex-1",
                    subjectColorMap[slot.subject.id]
                  )}
                >
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(slot)}
                      className="absolute top-2 right-2 opacity-0 hover:opacity-100 group-hover:opacity-100 text-current hover:text-red-600 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-sm leading-tight">
                        {slot.subject.name}
                      </p>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(slot)}
                          className="text-current hover:text-red-600 transition-colors shrink-0 ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] font-mono opacity-70">{slot.subject.code}</p>

                    <div className="flex items-center gap-1 text-[10px] opacity-80">
                      <Clock className="h-3 w-3 shrink-0" />
                      {slot.startTime} — {slot.endTime}
                    </div>

                    {showTeacher && (
                      <div className="flex items-center gap-1 text-[10px] opacity-80">
                        <User className="h-3 w-3 shrink-0" />
                        {slot.teacher.firstName} {slot.teacher.lastName}
                      </div>
                    )}

                    {showClass && (
                      <div className="flex items-center gap-1 text-[10px] opacity-80">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        {slot.class.displayName}
                        {slot.section && ` - ${slot.section.name}`}
                      </div>
                    )}

                    {slot.room && (
                      <div className="flex items-center gap-1 text-[10px] opacity-80">
                        <MapPin className="h-3 w-3 shrink-0" />
                        Room {slot.room}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}