import type { AttendanceSummary } from "@/features/attendance/actions/attendance.actions";
import { Users, UserCheck, UserX, Clock, CalendarOff } from "lucide-react";

interface AttendanceSummaryProps {
  summary: AttendanceSummary;
}

export function AttendanceSummaryCards({ summary }: AttendanceSummaryProps) {
  const cards = [
    {
      label: "Present",
      value: summary.present,
      icon: UserCheck,
      color: "bg-emerald-500/10 text-emerald-600",
      iconBg: "bg-emerald-500",
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: UserX,
      color: "bg-red-500/10 text-red-600",
      iconBg: "bg-red-500",
    },
    {
      label: "Late",
      value: summary.late,
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-600",
      iconBg: "bg-yellow-500",
    },
    {
      label: "Half Day",
      value: summary.halfDay,
      icon: CalendarOff,
      color: "bg-orange-500/10 text-orange-600",
      iconBg: "bg-orange-500",
    },
    {
      label: "On Leave",
      value: summary.leave,
      icon: CalendarOff,
      color: "bg-blue-500/10 text-blue-600",
      iconBg: "bg-blue-500",
    },
    {
      label: "Total",
      value: summary.total,
      icon: Users,
      color: "bg-violet-500/10 text-violet-600",
      iconBg: "bg-violet-500",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border bg-card p-3 text-center"
            >
              <div
                className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-lg font-bold font-display">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Attendance Rate */}
      {summary.total > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Attendance Rate</span>
            <span
              className={`text-sm font-bold ${
                summary.percentage >= 80
                  ? "text-emerald-600"
                  : summary.percentage >= 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {summary.percentage}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                summary.percentage >= 80
                  ? "bg-emerald-500"
                  : summary.percentage >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${summary.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}