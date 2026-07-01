import {
  GraduationCap,
  Users,
  Briefcase,
  Users2,
  ClipboardCheck,
  CalendarOff,
  UserPlus,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalEmployees: number;
    totalParents: number;
    attendanceRate: number;
    pendingLeaves: number;
    pendingAdmissions: number;
    monthlyFees: number;
    unpaidFees: number;
  };
}

const statCards = (stats: StatsCardsProps["stats"]) => [
  {
    title: "Total Students",
    value: stats.totalStudents.toLocaleString(),
    icon: GraduationCap,
    color: "bg-blue-500/10 text-blue-600",
    iconBg: "bg-blue-500",
    trend: null,
  },
  {
    title: "Total Teachers",
    value: stats.totalTeachers.toLocaleString(),
    icon: Users,
    color: "bg-emerald-500/10 text-emerald-600",
    iconBg: "bg-emerald-500",
    trend: null,
  },
  {
    title: "Employees",
    value: stats.totalEmployees.toLocaleString(),
    icon: Briefcase,
    color: "bg-violet-500/10 text-violet-600",
    iconBg: "bg-violet-500",
    trend: null,
  },
  {
    title: "Parents",
    value: stats.totalParents.toLocaleString(),
    icon: Users2,
    color: "bg-orange-500/10 text-orange-600",
    iconBg: "bg-orange-500",
    trend: null,
  },
  {
    title: "Today's Attendance",
    value: `${stats.attendanceRate}%`,
    icon: ClipboardCheck,
    color:
      stats.attendanceRate >= 80
        ? "bg-emerald-500/10 text-emerald-600"
        : "bg-red-500/10 text-red-600",
    iconBg:
      stats.attendanceRate >= 80 ? "bg-emerald-500" : "bg-red-500",
    trend:
      stats.attendanceRate >= 80
        ? { label: "Good", up: true }
        : { label: "Low", up: false },
  },
  {
    title: "Pending Leaves",
    value: stats.pendingLeaves.toLocaleString(),
    icon: CalendarOff,
    color: "bg-yellow-500/10 text-yellow-600",
    iconBg: "bg-yellow-500",
    trend:
      stats.pendingLeaves > 0
        ? { label: "Needs review", up: false }
        : null,
  },
  {
    title: "New Admissions",
    value: stats.pendingAdmissions.toLocaleString(),
    icon: UserPlus,
    color: "bg-sky-500/10 text-sky-600",
    iconBg: "bg-sky-500",
    trend:
      stats.pendingAdmissions > 0
        ? { label: "Pending review", up: true }
        : null,
  },
  {
    title: "Monthly Collections",
    value: formatCurrency(stats.monthlyFees),
    icon: CreditCard,
    color: "bg-teal-500/10 text-teal-600",
    iconBg: "bg-teal-500",
    trend: null,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = statCards(stats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-2xl font-bold font-display">
                  {card.value}
                </p>
                {card.trend && (
                  <div className="flex items-center gap-1">
                    {card.trend.up ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {card.trend.label}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}