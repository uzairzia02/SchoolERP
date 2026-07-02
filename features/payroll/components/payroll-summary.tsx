import type { PayrollSummaryData } from "@/features/payroll/actions/payroll.actions";
import { formatCurrency } from "@/lib/utils";
import { Banknote, Users, TrendingUp, Calendar, DollarSign } from "lucide-react";

interface PayrollSummaryProps {
  summary: PayrollSummaryData;
  currentMonth: string;
}

export function PayrollSummaryCards({ summary, currentMonth }: PayrollSummaryProps) {
  const cards = [
    {
      title: "Total Paid (All Time)",
      value: formatCurrency(summary.totalPaid),
      icon: Banknote,
      iconBg: "bg-blue-500",
      sub: "cumulative payroll",
    },
    {
      title: "Active Employees",
      value: summary.totalEmployees.toString(),
      icon: Users,
      iconBg: "bg-emerald-500",
      sub: "on payroll",
    },
    {
      title: `${currentMonth} Total`,
      value: formatCurrency(summary.currentMonthTotal),
      icon: Calendar,
      iconBg: "bg-violet-500",
      sub: `${summary.currentMonthCount} processed`,
    },
    {
      title: "Avg Salary",
      value: formatCurrency(summary.avgSalary),
      icon: TrendingUp,
      iconBg: "bg-teal-500",
      sub: "this month",
    },
    {
      title: "Pending",
      value: (summary.totalEmployees - summary.currentMonthCount).toString(),
      icon: DollarSign,
      iconBg: "bg-yellow-500",
      sub: "not yet processed",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg} mb-3`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-bold font-display">{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
              {card.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}