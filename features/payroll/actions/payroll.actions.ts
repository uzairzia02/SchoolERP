"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  processPayrollSchema,
  bulkPayrollSchema,
} from "@/features/payroll/schemas/payroll.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { PaymentMethod, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PayrollListItem = {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paidDate: Date | null;
  paymentMethod: PaymentMethod | null;
  remarks: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: { name: string } | null;
    designation: { name: string } | null;
  };
};

export type PayrollSummaryData = {
  totalPaid: number;
  totalEmployees: number;
  currentMonthTotal: number;
  currentMonthCount: number;
  avgSalary: number;
};

// ─────────────────────────────────────────────────────────────
// Get Payroll Records
// ─────────────────────────────────────────────────────────────

export async function getPayrollRecords(params: {
  page?: number;
  pageSize?: number;
  month?: number;
  year?: number;
  search?: string;
  departmentId?: string;
}): Promise<PaginatedResponse<PayrollListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);
  const currentDate = new Date();

  const where: Prisma.PayrollWhereInput = {
    schoolId,
    ...(params.month && { month: params.month }),
    ...(params.year && { year: params.year }),
    ...(params.search && {
      employee: {
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
          { employeeId: { contains: params.search, mode: "insensitive" } },
        ],
      },
    }),
    ...(params.departmentId && {
      employee: { departmentId: params.departmentId },
    }),
  };

  const [data, total] = await Promise.all([
    db.payroll.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: {
        id: true,
        month: true,
        year: true,
        basicSalary: true,
        allowances: true,
        deductions: true,
        netSalary: true,
        paidDate: true,
        paymentMethod: true,
        remarks: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    }),
    db.payroll.count({ where }),
  ]);

  return buildPaginatedResponse(
    data.map((p) => ({
      ...p,
      basicSalary: Number(p.basicSalary),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      netSalary: Number(p.netSalary),
    })),
    total,
    page,
    pageSize
  );
}

// ─────────────────────────────────────────────────────────────
// Payroll Summary
// ─────────────────────────────────────────────────────────────

export async function getPayrollSummary(): Promise<PayrollSummaryData> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [totalAgg, totalEmployees, currentMonthAgg, currentMonthCount] =
    await Promise.all([
      db.payroll.aggregate({
        where: { schoolId },
        _sum: { netSalary: true },
      }),
      db.employee.count({
        where: { schoolId, isActive: true, deletedAt: null },
      }),
      db.payroll.aggregate({
        where: { schoolId, month: currentMonth, year: currentYear },
        _sum: { netSalary: true },
        _avg: { netSalary: true },
      }),
      db.payroll.count({
        where: { schoolId, month: currentMonth, year: currentYear },
      }),
    ]);

  return {
    totalPaid: Number(totalAgg._sum.netSalary ?? 0),
    totalEmployees,
    currentMonthTotal: Number(currentMonthAgg._sum.netSalary ?? 0),
    currentMonthCount,
    avgSalary: Number(currentMonthAgg._avg.netSalary ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────
// Get Employees for Payroll
// ─────────────────────────────────────────────────────────────

export async function getEmployeesForPayroll(month: number, year: number) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const employees = await db.employee.findMany({
    where: { schoolId, isActive: true, deletedAt: null },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      salary: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      payroll: {
        where: { month, year },
        select: { id: true, netSalary: true, paidDate: true },
        take: 1,
      },
    },
  });

  return employees.map((e) => ({
    ...e,
    salary: e.salary ? Number(e.salary) : null,
    payroll: e.payroll[0] ?? null,
  }));
}

// ─────────────────────────────────────────────────────────────
// Process Single Payroll
// ─────────────────────────────────────────────────────────────

export async function processPayrollAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = processPayrollSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    employeeId,
    month,
    year,
    basicSalary,
    allowances,
    deductions,
    paymentMethod,
    remarks,
  } = parsed.data;

  const netSalary = basicSalary + allowances - deductions;

  try {
    const payroll = await db.payroll.upsert({
      where: { employeeId_month_year: { employeeId, month, year } },
      update: {
        basicSalary,
        allowances,
        deductions,
        netSalary,
        paidDate: new Date(),
        paymentMethod: paymentMethod as PaymentMethod,
        remarks: remarks ?? null,
        createdBy: session.user.id,
      },
      create: {
        schoolId,
        employeeId,
        month,
        year,
        basicSalary,
        allowances,
        deductions,
        netSalary,
        paidDate: new Date(),
        paymentMethod: paymentMethod as PaymentMethod,
        remarks: remarks ?? null,
        createdBy: session.user.id,
      },
    });

    revalidatePath("/dashboard/payroll");
    return {
      success: true,
      data: { id: payroll.id },
      message: `Payroll processed — Net salary: PKR ${netSalary.toLocaleString()}`,
    };
  } catch (error) {
    console.error("Process payroll error:", error);
    return { success: false, error: "Failed to process payroll." };
  }
}

// ─────────────────────────────────────────────────────────────
// Bulk Process Payroll
// ─────────────────────────────────────────────────────────────

export async function bulkProcessPayrollAction(
  values: unknown
): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = bulkPayrollSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { month, year, paymentMethod, employeeIds } = parsed.data;

  const employees = await db.employee.findMany({
    where: {
      id: { in: employeeIds },
      schoolId,
      isActive: true,
    },
    select: { id: true, salary: true },
  });

  let count = 0;

  for (const emp of employees) {
    if (!emp.salary) continue;

    const basicSalary = Number(emp.salary);
    await db.payroll.upsert({
      where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      update: {
        basicSalary,
        netSalary: basicSalary,
        paidDate: new Date(),
        paymentMethod: paymentMethod as PaymentMethod,
        createdBy: session.user.id,
      },
      create: {
        schoolId,
        employeeId: emp.id,
        month,
        year,
        basicSalary,
        allowances: 0,
        deductions: 0,
        netSalary: basicSalary,
        paidDate: new Date(),
        paymentMethod: paymentMethod as PaymentMethod,
        createdBy: session.user.id,
      },
    });
    count++;
  }

  revalidatePath("/dashboard/payroll");
  return {
    success: true,
    data: { count },
    message: `Payroll processed for ${count} employee(s).`,
  };
}

// ─────────────────────────────────────────────────────────────
// Delete Payroll Record
// ─────────────────────────────────────────────────────────────

export async function deletePayrollAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.payroll.delete({
    where: { id, schoolId: session.user.schoolId },
  });

  revalidatePath("/dashboard/payroll");
  return { success: true, data: null, message: "Payroll record deleted." };
}