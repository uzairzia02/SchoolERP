import type { FeeSummary } from "@/features/fees/actions/fee.actions";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, Tag, TrendingUp,
} from "lucide-react";

interface FeeSummaryCardsProps {
  summary: FeeSummary;
}

export function FeeSummaryCards({ summary }: FeeSummaryCardsProps) {
  const cards = [
    {
      title: "Total Assigned",
      value: formatCurrency(summary.totalAmount),
      icon: CreditCard,
      iconBg: "bg-blue-500",
      sub: `${summary.paidCount + summary.unpaidCount + summary.overdueCount} records`,
    },
    {
      title: "Collected",
      value: formatCurrency(summary.totalCollected),
      icon: CheckCircle,
      iconBg: "bg-emerald-500",
      sub: `${summary.paidCount} paid`,
    },
    {
      title: "Pending",
      value: formatCurrency(summary.totalPending),
      icon: Clock,
      iconBg: "bg-yellow-500",
      sub: `${summary.unpaidCount} unpaid`,
    },
    {
      title: "Overdue",
      value: summary.overdueCount.toString(),
      icon: AlertTriangle,
      iconBg: "bg-red-500",
      sub: "fees past due date",
    },
    {
      title: "Discounts",
      value: formatCurrency(summary.totalDiscount),
      icon: Tag,
      iconBg: "bg-violet-500",
      sub: "total discounts given",
    },
    {
      title: "Collection Rate",
      value: summary.totalAmount > 0
        ? `${Math.round((summary.totalCollected / summary.totalAmount) * 100)}%`
        : "0%",
      icon: TrendingUp,
      iconBg: "bg-teal-500",
      sub: "of total assigned",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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