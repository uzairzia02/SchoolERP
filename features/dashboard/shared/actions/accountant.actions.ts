"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeeStatus } from "@prisma/client";

export async function getAccountantStats() {
  const session = await auth();
  if (!session?.user) return null;

  const schoolId = session.user.schoolId;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, now.getMonth(), 1);
  const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);

  const [
    feeCollectedThisMonth,
    outstandingFeesRaw,
    overdueFeesCount,
    recentPayments,
    activeEmployeeCount,
    payrollProcessedThisMonth,
    totalPayrollThisMonth,
  ] = await Promise.all([
    db.fee.aggregate({
      where: { schoolId, paidDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { paidAmount: true },
    }),

    db.fee.findMany({
      where: {
        schoolId,
        status: { in: [FeeStatus.UNPAID, FeeStatus.PARTIAL, FeeStatus.OVERDUE] },
      },
      select: { amount: true, fine: true, discount: true, paidAmount: true },
    }),

    db.fee.count({ where: { schoolId, status: FeeStatus.OVERDUE } }),

    db.fee.findMany({
      where: { schoolId, paidDate: { not: null } },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        feeType: { select: { name: true } },
      },
      orderBy: { paidDate: "desc" },
      take: 5,
    }),

    db.employee.count({ where: { schoolId, isActive: true } }),

    db.payroll.count({
      where: { schoolId, month: currentMonth, year: currentYear, paidDate: { not: null } },
    }),

    db.payroll.aggregate({
      where: { schoolId, month: currentMonth, year: currentYear },
      _sum: { netSalary: true },
    }),
  ]);

  const outstandingTotal = outstandingFeesRaw.reduce(
    (sum, f) =>
      sum + Number(f.amount) + Number(f.fine) - Number(f.discount) - Number(f.paidAmount),
    0
  );

  return {
    feeCollectedThisMonth: Number(feeCollectedThisMonth._sum.paidAmount ?? 0),
    outstandingFees: outstandingTotal,
    overdueFeesCount,
    recentPayments: recentPayments.map((f) => ({
      id: f.id,
      studentName: `${f.student.firstName} ${f.student.lastName}`,
      admissionNumber: f.student.admissionNumber,
      feeType: f.feeType.name,
      amount: Number(f.paidAmount),
      paidDate: f.paidDate,
      method: f.paymentMethod,
    })),
    payrollStatus: {
      totalEmployees: activeEmployeeCount,
      processed: payrollProcessedThisMonth,
      pending: activeEmployeeCount - payrollProcessedThisMonth,
      totalAmount: Number(totalPayrollThisMonth._sum.netSalary ?? 0),
    },
  };
}
