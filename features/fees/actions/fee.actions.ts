"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  feeTypeSchema,
  feeTypeUpdateSchema,
  assignFeeSchema,
  collectFeeSchema,
} from "@/features/fees/schemas/fee.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { FeeStatus, PaymentMethod, Prisma } from "@prisma/client";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type FeeTypeItem = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  isRecurring: boolean;
  _count: { fees: number };
};

export type FeeListItem = {
  id: string;
  amount: number;
  discount: number;
  fine: number;
  paidAmount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: FeeStatus;
  paymentMethod: PaymentMethod | null;
  receiptNumber: string | null;
  remarks: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class: { name: string } | null;
  };
  feeType: { id: string; name: string };
};

export type FeeSummary = {
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
  totalDiscount: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
};

// ─────────────────────────────────────────────────────────────
// Fee Types CRUD
// ─────────────────────────────────────────────────────────────

export async function getFeeTypes(): Promise<FeeTypeItem[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const feeTypes = await db.feeType.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      amount: true,
      isRecurring: true,
      _count: { select: { fees: true } },
    },
  });

  return feeTypes.map((f) => ({ ...f, amount: Number(f.amount) }));
}

export async function createFeeTypeAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = feeTypeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const feeType = await db.feeType.create({
    data: { schoolId: session.user.schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/fees/types");
  return {
    success: true,
    data: { id: feeType.id },
    message: "Fee type created successfully.",
  };
}

export async function updateFeeTypeAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = feeTypeUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  await db.feeType.update({ where: { id }, data });

  revalidatePath("/dashboard/fees/types");
  return {
    success: true,
    data: { id },
    message: "Fee type updated successfully.",
  };
}

export async function deleteFeeTypeAction(
  id: string
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const feeType = await db.feeType.findFirst({
    where: { id, schoolId: session.user.schoolId },
    select: { _count: { select: { fees: true } } },
  });

  if (!feeType) {
    return { success: false, error: "Fee type not found." };
  }

  if (feeType._count.fees > 0) {
    return {
      success: false,
      error: `Cannot delete — ${feeType._count.fees} fee record(s) use this type.`,
    };
  }

  await db.feeType.delete({ where: { id } });

  revalidatePath("/dashboard/fees/types");
  return { success: true, data: null, message: "Fee type deleted." };
}

// ─────────────────────────────────────────────────────────────
// Get Fees (paginated)
// ─────────────────────────────────────────────────────────────

export async function getFees(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: FeeStatus;
  classId?: string;
  feeTypeId?: string;
}): Promise<PaginatedResponse<FeeListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.FeeWhereInput = {
    schoolId,
    ...(params.status && { status: params.status }),
    ...(params.feeTypeId && { feeTypeId: params.feeTypeId }),
    ...(params.search && {
      student: {
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
          { admissionNumber: { contains: params.search, mode: "insensitive" } },
        ],
      },
    }),
    ...(params.classId && {
      student: { classId: params.classId },
    }),
  };

  const [data, total] = await Promise.all([
    db.fee.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        amount: true,
        discount: true,
        fine: true,
        paidAmount: true,
        dueDate: true,
        paidDate: true,
        status: true,
        paymentMethod: true,
        receiptNumber: true,
        remarks: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            class: { select: { name: true } },
          },
        },
        feeType: { select: { id: true, name: true } },
      },
    }),
    db.fee.count({ where }),
  ]);

  return buildPaginatedResponse(
    data.map((f) => ({
      ...f,
      amount: Number(f.amount),
      discount: Number(f.discount),
      fine: Number(f.fine),
      paidAmount: Number(f.paidAmount),
    })),
    total,
    page,
    pageSize
  );
}

// ─────────────────────────────────────────────────────────────
// Fee Summary
// ─────────────────────────────────────────────────────────────

export async function getFeeSummary(): Promise<FeeSummary> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const [totalAgg, collectedAgg, discountAgg, paidCount, unpaidCount, overdueCount] =
    await Promise.all([
      db.fee.aggregate({
        where: { schoolId },
        _sum: { amount: true },
      }),
      db.fee.aggregate({
        where: { schoolId, status: "PAID" },
        _sum: { paidAmount: true },
      }),
      db.fee.aggregate({
        where: { schoolId },
        _sum: { discount: true },
      }),
      db.fee.count({ where: { schoolId, status: "PAID" } }),
      db.fee.count({ where: { schoolId, status: "UNPAID" } }),
      db.fee.count({ where: { schoolId, status: "OVERDUE" } }),
    ]);

  const totalAmount = Number(totalAgg._sum.amount ?? 0);
  const totalCollected = Number(collectedAgg._sum.paidAmount ?? 0);
  const totalDiscount = Number(discountAgg._sum.discount ?? 0);

  return {
    totalAmount,
    totalCollected,
    totalPending: totalAmount - totalCollected,
    totalDiscount,
    paidCount,
    unpaidCount,
    overdueCount,
  };
}

// ─────────────────────────────────────────────────────────────
// Assign Fee to Students
// ─────────────────────────────────────────────────────────────

export async function assignFeeAction(
  values: unknown
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = assignFeeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { studentIds, feeTypeId, amount, dueDate, discount, remarks } = parsed.data;

  await db.fee.createMany({
    data: studentIds.map((studentId) => ({
      schoolId,
      studentId,
      feeTypeId,
      amount,
      discount: discount ?? 0,
      dueDate: new Date(dueDate),
      remarks: remarks ?? null,
      createdBy: session.user.id,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard/fees");
  return {
    success: true,
    data: null,
    message: `Fee assigned to ${studentIds.length} student(s).`,
  };
}

// ─────────────────────────────────────────────────────────────
// Collect Fee Payment
// ─────────────────────────────────────────────────────────────

export async function collectFeeAction(
  values: unknown
): Promise<ActionResult<{ receiptNumber: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = collectFeeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { feeId, paidAmount, paymentMethod, remarks } = parsed.data;

  const fee = await db.fee.findFirst({
    where: { id: feeId, schoolId: session.user.schoolId },
  });

  if (!fee) {
    return { success: false, error: "Fee record not found." };
  }

  const netAmount = Number(fee.amount) - Number(fee.discount) + Number(fee.fine);
  const totalPaid = Number(fee.paidAmount) + paidAmount;

  if (totalPaid > netAmount) {
    return {
      success: false,
      error: `Overpayment. Maximum payable amount is PKR ${(netAmount - Number(fee.paidAmount)).toLocaleString()}.`,
    };
  }

  const newStatus: FeeStatus =
    totalPaid >= netAmount ? "PAID" : "PARTIAL";

  const receiptNumber = `RCP-${Date.now()}`;

  await db.fee.update({
    where: { id: feeId },
    data: {
      paidAmount: totalPaid,
      status: newStatus,
      paidDate: newStatus === "PAID" ? new Date() : fee.paidDate,
      paymentMethod: paymentMethod as PaymentMethod,
      receiptNumber,
      remarks: remarks ?? fee.remarks,
    },
  });

  revalidatePath("/dashboard/fees");
  return {
    success: true,
    data: { receiptNumber },
    message: `Payment of PKR ${paidAmount.toLocaleString()} collected. Receipt: ${receiptNumber}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Mark Fees as Overdue
// ─────────────────────────────────────────────────────────────

export async function markOverdueFees(): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.fee.updateMany({
    where: {
      schoolId: session.user.schoolId,
      status: { in: ["UNPAID", "PARTIAL"] },
      dueDate: { lt: today },
    },
    data: { status: "OVERDUE" },
  });

  revalidatePath("/dashboard/fees");
  return { success: true, data: null, message: "Overdue fees updated." };
}

// ─────────────────────────────────────────────────────────────
// Get Student Fees
// ─────────────────────────────────────────────────────────────

export async function getStudentFees(studentId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const fees = await db.fee.findMany({
    where: { studentId, schoolId: session.user.schoolId },
    orderBy: { dueDate: "desc" },
    select: {
      id: true,
      amount: true,
      discount: true,
      fine: true,
      paidAmount: true,
      dueDate: true,
      paidDate: true,
      status: true,
      paymentMethod: true,
      receiptNumber: true,
      feeType: { select: { name: true } },
    },
  });

  return fees.map((f) => ({
    ...f,
    amount: Number(f.amount),
    discount: Number(f.discount),
    fine: Number(f.fine),
    paidAmount: Number(f.paidAmount),
  }));
}