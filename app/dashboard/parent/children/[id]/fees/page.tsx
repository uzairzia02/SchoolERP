import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getChildFees } from "@/features/parents/actions/parent-child.actions";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PayFeeDialog } from "@/features/parents/components/pay-fee-dialog";
import { Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Child Fees" };

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-700",
  UNPAID: "bg-red-500/10 text-red-700",
  PARTIAL: "bg-amber-500/10 text-amber-700",
  OVERDUE: "bg-red-600/10 text-red-800",
  WAIVED: "bg-gray-500/10 text-gray-700",
};

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function formatDateOnly(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export default async function ChildFeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARENT") redirect("/login");

  const { id } = await params;
  const data = await getChildFees(id);

  if (!data) notFound();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.studentName}&apos;s Fees</h1>
        <p className="text-sm text-muted-foreground">{data.className}</p>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center gap-3 max-w-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
          <Wallet className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-xl font-semibold leading-none">{formatCurrency(data.totalOutstanding)}</p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
        </div>
      </div>

      {data.fees.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No fee records found.
        </div>
      ) : (
        <div className="space-y-3">
          {data.fees.map((f) => (
            <div key={f.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-medium">{f.feeType}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDateOnly(f.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`${STATUS_COLORS[f.status] ?? ""} border-0 font-normal`}>
                    {f.status}
                  </Badge>
                  {f.status !== "PAID" && (
                    <PayFeeDialog
                      feeId={f.id}
                      studentId={id}
                      feeTypeName={f.feeType}
                      amountDue={f.amount + f.fine - f.discount - f.paidAmount}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(f.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-medium">{formatCurrency(f.paidAmount)}</p>
                </div>
              </div>

              {/* Transaction details — shown once paid */}
              {f.status === "PAID" && f.paidDate && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  {f.receiptNumber && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Transaction No.</span>
                      <span className="font-mono font-medium">{f.receiptNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Paid On</span>
                    <span className="font-medium">{formatDateTime(f.paidDate)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
