import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountantStats } from "@/features/dashboard/shared/actions/dashboard.actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CreditCard, CheckCircle, Clock, AlertTriangle,
  Banknote, TrendingUp, Receipt, DollarSign,
} from "lucide-react";

export const metadata: Metadata = { title: "Accountant Dashboard" };

const STATUS_COLORS: Record<string, string> = {
  PAID: "text-emerald-600",
  UNPAID: "text-yellow-600",
  PARTIAL: "text-blue-600",
  OVERDUE: "text-red-600",
};

export default async function AccountantDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ACCOUNTANT") redirect("/login");

  const stats = await getAccountantStats();

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold font-display">Accounts Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fee collection and payroll overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Assigned", value: formatCurrency(stats.totalFees), sub: "all time", icon: CreditCard, color: "bg-blue-500" },
          { label: "Collected", value: formatCurrency(stats.collectedFees), sub: `${stats.collectionRate}% rate`, icon: CheckCircle, color: "bg-emerald-500" },
          { label: "Pending", value: formatCurrency(stats.pendingFees), sub: `${stats.unpaidCount} unpaid`, icon: Clock, color: "bg-yellow-500" },
          { label: "Overdue", value: stats.overdueCount, sub: "past due date", icon: AlertTriangle, color: "bg-red-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color} mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xl font-bold font-display">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Today + This Month + Payroll */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Today's Collection</p>
          </div>
          <p className="text-2xl font-bold font-display text-emerald-600">
            {formatCurrency(stats.todayCollected)}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">This Month's Collection</p>
          </div>
          <p className="text-2xl font-bold font-display text-blue-600">
            {formatCurrency(stats.thisMonthCollected)}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Payroll This Month</p>
          </div>
          <p className="text-2xl font-bold font-display">
            {formatCurrency(stats.payrollThisMonth)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.payrollProcessed} processed · {stats.payrollPending} pending
          </p>
        </div>
      </div>

      {/* Collection Rate Bar */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Overall Fee Collection Rate</p>
          <p className={`text-sm font-bold ${stats.collectionRate >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
            {stats.collectionRate}%
          </p>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${stats.collectionRate >= 80 ? "bg-emerald-500" : "bg-yellow-500"}`}
            style={{ width: `${stats.collectionRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div>
            <p className="text-xs font-bold text-emerald-600">{stats.collectionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Collected</p>
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600">{stats.partialCount}</p>
            <p className="text-[10px] text-muted-foreground">Partial</p>
          </div>
          <div>
            <p className="text-xs font-bold text-red-600">{stats.overdueCount}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">Recent Payments</h3>
            </div>
            <Link href="/dashboard/fees" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-accent transition-colors">
                  <div>
                    <p className="text-sm font-medium">
                      {payment.student.firstName} {payment.student.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.feeType.name} · {payment.student.admissionNumber}
                    </p>
                    {payment.receiptNumber && (
                      <p className="text-[10px] font-mono text-muted-foreground">{payment.receiptNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(payment.paidAmount)}
                    </p>
                    {payment.paidDate && (
                      <p className="text-[10px] text-muted-foreground">{formatDate(payment.paidDate)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Fees */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold font-display text-sm text-red-700">Overdue Fees</h3>
            </div>
            <Link href="/dashboard/fees?status=OVERDUE" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {stats.overdueList.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-emerald-600 font-medium">No overdue fees!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.overdueList.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-500/5 p-2.5">
                  <div>
                    <p className="text-sm font-medium">
                      {fee.student.firstName} {fee.student.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fee.feeType.name} · Class {fee.student.class?.name}
                    </p>
                    <p className="text-[10px] text-red-600">Due: {formatDate(fee.dueDate)}</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    {formatCurrency(fee.balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}