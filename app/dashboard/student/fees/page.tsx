import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CreditCard, Receipt, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = { title: "My Fees | Student Dashboard" };

enum FeeStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
  PARTIAL = "PARTIAL",
  OVERDUE = "OVERDUE"
}

export default async function StudentFeesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-semibold">Student profile record not found.</p>
      </div>
    );
  }

  const feeRecords = await db.fee.findMany({
    where: { studentId: student.id },
    include: {
      feeType: {
        select: { name: true }
      }
    },
    orderBy: { dueDate: "desc" },
  });

  const totalOutstanding = feeRecords
    .filter(f => f.status !== FeeStatus.PAID)
    .reduce((sum, f) => sum + (Number(f.amount) + Number(f.fine) - Number(f.discount) - Number(f.paidAmount)), 0);

  const paidCount = feeRecords.filter(f => f.status === FeeStatus.PAID).length;
  const pendingCount = feeRecords.filter(f => f.status !== FeeStatus.PAID).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header section */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Slips & Invoices</h1>
          <p className="text-sm text-slate-500">
            Monitor accounts, structure tracking status, and retrieve financial breakdown logs.
          </p>
        </div>
      </div>

      {/* Analytics Cards Block */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 rounded-xl border border-rose-100 bg-rose-50/20 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-rose-600">Total Payable Dues</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            Rs. {totalOutstanding.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Pending action required</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-600">Cleared Vouchers</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{paidCount}</div>
          <p className="text-xs text-slate-400 mt-1">Processed successfully</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-600">Active Pending Invoices</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <p className="text-xs text-slate-400 mt-1">Awaiting confirmation entries</p>
        </div>
      </div>

      {/* Ledger Block */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Financial Statement Ledger</h2>
            <p className="text-xs text-slate-400 mt-0.5">Itemized logs for transactional verification audits.</p>
          </div>
          <Receipt className="w-4 h-4 text-slate-400" />
        </div>
        
        <div className="p-6">
          {feeRecords.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              No structural fee challans allocated inside database index yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-100">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-3 font-semibold text-slate-700">Challan Title</th>
                    <th className="p-3 font-semibold text-slate-700">Receipt No.</th>
                    <th className="p-3 font-semibold text-slate-700">Target Deadline</th>
                    <th className="p-3 font-semibold text-slate-700 text-right">Base Fee</th>
                    <th className="p-3 font-semibold text-slate-700 text-right">Fine / Adj.</th>
                    <th className="p-3 font-semibold text-slate-700 text-right">Paid Amount</th>
                    <th className="p-3 font-semibold text-slate-700 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeRecords.map((fee) => {
                    return (
                      <tr key={fee.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 font-medium max-w-[200px] truncate">
                          {fee.feeType?.name || "Academic Tuition Fee"}
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-400">
                          {fee.receiptNumber || "—"}
                        </td>
                        <td className="p-3 text-xs text-slate-500">
                          {fee.dueDate ? format(new Date(fee.dueDate), "MMM dd, yyyy") : "—"}
                        </td>
                        <td className="p-3 text-right">
                          Rs. {Number(fee.amount).toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-xs text-slate-400">
                          {Number(fee.fine) > 0 ? `+Rs. ${Number(fee.fine)}` : ""}
                          {Number(fee.discount) > 0 ? ` -Rs. ${Number(fee.discount)}` : ""}
                          {Number(fee.fine) === 0 && Number(fee.discount) === 0 ? "—" : ""}
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          Rs. {Number(fee.paidAmount).toLocaleString()}
                        </td>
                        <td className="p-3 text-center align-middle">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${fee.status === FeeStatus.PAID ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              fee.status === FeeStatus.PARTIAL ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                              fee.status === FeeStatus.OVERDUE ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                              'bg-slate-50 text-slate-700 border-slate-100'}`}
                          >
                            {fee.status === FeeStatus.PAID && <CheckCircle2 className="w-3 h-3" />}
                            {fee.status === FeeStatus.PARTIAL && <Clock className="w-3 h-3" />}
                            {fee.status === FeeStatus.OVERDUE && <AlertCircle className="w-3 h-3" />}
                            {fee.status.charAt(0) + fee.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}