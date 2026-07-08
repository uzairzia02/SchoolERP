"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// Attendance Report
// ─────────────────────────────────────────────────────────────

export type AttendanceReportRow = {
  studentId: string;
  admissionNumber: string;
  name: string;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  percentage: number;
};

export async function getAttendanceReport(params: {
  classId?: string;
  sectionId?: string;
  startDate: string;
  endDate: string;
}): Promise<AttendanceReportRow[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  end.setHours(23, 59, 59, 999);

  const students = await db.student.findMany({
    where: {
      schoolId,
      isActive: true,
      deletedAt: null,
      ...(params.classId && { classId: params.classId }),
      ...(params.sectionId && { sectionId: params.sectionId }),
    },
    orderBy: [{ class: { order: "asc" } }, { rollNumber: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      rollNumber: true,
      class: { select: { name: true, displayName: true } },
      section: { select: { name: true } },
      attendance: {
        where: { date: { gte: start, lte: end } },
        select: { status: true },
      },
    },
  });

  return students.map((s) => {
    const present = s.attendance.filter((a) => a.status === "PRESENT").length;
    const absent = s.attendance.filter((a) => a.status === "ABSENT").length;
    const late = s.attendance.filter((a) => a.status === "LATE").length;
    const halfDay = s.attendance.filter((a) => a.status === "HALF_DAY").length;
    const leave = s.attendance.filter((a) => a.status === "LEAVE").length;
    const total = s.attendance.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      studentId: s.id,
      admissionNumber: s.admissionNumber,
      name: `${s.firstName} ${s.lastName}`,
      className: s.class?.displayName ?? "—",
      sectionName: s.section?.name ?? "—",
      rollNumber: s.rollNumber,
      totalDays: total,
      present,
      absent,
      late,
      halfDay,
      leave,
      percentage,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Student Report
// ─────────────────────────────────────────────────────────────

export type StudentReportRow = {
  admissionNumber: string;
  name: string;
  gender: string;
  dateOfBirth: Date;
  className: string;
  sectionName: string;
  rollNumber: string | null;
  phone: string | null;
  email: string;
  parentName: string;
  parentPhone: string;
  admissionDate: Date;
  isActive: boolean;
};

export async function getStudentReport(params: {
  classId?: string;
  sectionId?: string;
  isActive?: boolean;
  gender?: string;
}): Promise<StudentReportRow[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const students = await db.student.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(params.classId && { classId: params.classId }),
      ...(params.sectionId && { sectionId: params.sectionId }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.gender && { gender: params.gender as any }),
    },
    orderBy: [{ class: { order: "asc" } }, { rollNumber: "asc" }],
    select: {
      admissionNumber: true,
      firstName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
      rollNumber: true,
      phone: true,
      admissionDate: true,
      isActive: true,
      class: { select: { displayName: true } },
      section: { select: { name: true } },
      user: { select: { email: true } },
      parents: {
        take: 1,
        select: {
          parent: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  return students.map((s) => ({
    admissionNumber: s.admissionNumber,
    name: `${s.firstName} ${s.lastName}`,
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    className: s.class?.displayName ?? "—",
    sectionName: s.section?.name ?? "—",
    rollNumber: s.rollNumber,
    phone: s.phone,
    email: s.user.email,
    parentName: s.parents[0]
      ? `${s.parents[0].parent.firstName} ${s.parents[0].parent.lastName}`
      : "—",
    parentPhone: s.parents[0]?.parent.phone ?? "—",
    admissionDate: s.admissionDate,
    isActive: s.isActive,
  }));
}

// ─────────────────────────────────────────────────────────────
// Fee Report
// ─────────────────────────────────────────────────────────────

export type FeeReportRow = {
  admissionNumber: string;
  studentName: string;
  className: string;
  feeType: string;
  amount: number;
  discount: number;
  fine: number;
  netAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: Date;
  paidDate: Date | null;
  status: string;
  paymentMethod: string | null;
  receiptNumber: string | null;
};

export type FeeSummaryData = {
  totalAssigned: number;
  totalCollected: number;
  totalPending: number;
  totalDiscount: number;
  totalFine: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  partialCount: number;
};

export async function getFeeReport(params: {
  classId?: string;
  feeTypeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ rows: FeeReportRow[]; summary: FeeSummaryData }> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const fees = await db.fee.findMany({
    where: {
      schoolId,
      ...(params.status && { status: params.status as any }),
      ...(params.feeTypeId && { feeTypeId: params.feeTypeId }),
      ...(params.classId && {
        student: { classId: params.classId },
      }),
      ...(params.startDate &&
        params.endDate && {
          dueDate: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          },
        }),
    },
    orderBy: { dueDate: "asc" },
    select: {
      amount: true,
      discount: true,
      fine: true,
      paidAmount: true,
      dueDate: true,
      paidDate: true,
      status: true,
      paymentMethod: true,
      receiptNumber: true,
      student: {
        select: {
          admissionNumber: true,
          firstName: true,
          lastName: true,
          class: { select: { displayName: true } },
        },
      },
      feeType: { select: { name: true } },
    },
  });

  const rows: FeeReportRow[] = fees.map((f) => {
    const amount = Number(f.amount);
    const discount = Number(f.discount);
    const fine = Number(f.fine);
    const paidAmount = Number(f.paidAmount);
    const netAmount = amount - discount + fine;

    return {
      admissionNumber: f.student.admissionNumber,
      studentName: `${f.student.firstName} ${f.student.lastName}`,
      className: f.student.class?.displayName ?? "—",
      feeType: f.feeType.name,
      amount,
      discount,
      fine,
      netAmount,
      paidAmount,
      balance: netAmount - paidAmount,
      dueDate: f.dueDate,
      paidDate: f.paidDate,
      status: f.status,
      paymentMethod: f.paymentMethod,
      receiptNumber: f.receiptNumber,
    };
  });

  const summary: FeeSummaryData = {
    totalAssigned: rows.reduce((s, r) => s + r.netAmount, 0),
    totalCollected: rows.reduce((s, r) => s + r.paidAmount, 0),
    totalPending: rows.reduce((s, r) => s + r.balance, 0),
    totalDiscount: rows.reduce((s, r) => s + r.discount, 0),
    totalFine: rows.reduce((s, r) => s + r.fine, 0),
    paidCount: rows.filter((r) => r.status === "PAID").length,
    unpaidCount: rows.filter((r) => r.status === "UNPAID").length,
    overdueCount: rows.filter((r) => r.status === "OVERDUE").length,
    partialCount: rows.filter((r) => r.status === "PARTIAL").length,
  };

  return { rows, summary };
}

// ─────────────────────────────────────────────────────────────
// Payroll Report
// ─────────────────────────────────────────────────────────────

export type PayrollReportRow = {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentMethod: string | null;
  paidDate: Date | null;
};

export type PayrollSummaryReport = {
  totalBasic: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
};

export async function getPayrollReport(params: {
  month: number;
  year: number;
  departmentId?: string;
}): Promise<{ rows: PayrollReportRow[]; summary: PayrollSummaryReport }> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const records = await db.payroll.findMany({
    where: {
      schoolId,
      month: params.month,
      year: params.year,
      ...(params.departmentId && {
        employee: { departmentId: params.departmentId },
      }),
    },
    orderBy: { employee: { firstName: "asc" } },
    select: {
      month: true,
      year: true,
      basicSalary: true,
      allowances: true,
      deductions: true,
      netSalary: true,
      paymentMethod: true,
      paidDate: true,
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
    },
  });

  const rows: PayrollReportRow[] = records.map((r) => ({
    employeeId: r.employee.employeeId,
    name: `${r.employee.firstName} ${r.employee.lastName}`,
    department: r.employee.department?.name ?? "—",
    designation: r.employee.designation?.name ?? "—",
    month: r.month,
    year: r.year,
    basicSalary: Number(r.basicSalary),
    allowances: Number(r.allowances),
    deductions: Number(r.deductions),
    netSalary: Number(r.netSalary),
    paymentMethod: r.paymentMethod,
    paidDate: r.paidDate,
  }));

  const summary: PayrollSummaryReport = {
    totalBasic: rows.reduce((s, r) => s + r.basicSalary, 0),
    totalAllowances: rows.reduce((s, r) => s + r.allowances, 0),
    totalDeductions: rows.reduce((s, r) => s + r.deductions, 0),
    totalNet: rows.reduce((s, r) => s + r.netSalary, 0),
    employeeCount: rows.length,
  };

  return { rows, summary };
}

// ─────────────────────────────────────────────────────────────
// Staff Report
// ─────────────────────────────────────────────────────────────

export type StaffReportRow = {
  employeeId: string;
  name: string;
  type: "Teacher" | "Employee";
  gender: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  qualification: string | null;
  experience: number | null;
  joiningDate: Date;
  salary: number | null;
  isActive: boolean;
  lastWorkingDate: Date | null;
  leavingReason: string | null;
};

export async function getStaffReport(params: {
  type?: "TEACHER" | "EMPLOYEE";
  departmentId?: string;
  isActive?: boolean;
}): Promise<StaffReportRow[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const rows: StaffReportRow[] = [];

  if (!params.type || params.type === "TEACHER") {
    const teachers = await db.teacher.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(params.departmentId && { departmentId: params.departmentId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      },
      orderBy: { firstName: "asc" },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        gender: true,
        email: true,
        phone: true,
        qualification: true,
        experience: true,
        joiningDate: true,
        isActive: true,
        lastWorkingDate: true,
        leavingReason: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    rows.push(
      ...teachers.map((t) => ({
        employeeId: t.employeeId,
        name: `${t.firstName} ${t.lastName}`,
        type: "Teacher" as const,
        gender: t.gender,
        department: t.department?.name ?? "—",
        designation: t.designation?.name ?? "—",
        email: t.email,
        phone: t.phone,
        qualification: t.qualification,
        experience: t.experience,
        joiningDate: t.joiningDate,
        salary: null,
        isActive: t.isActive,
        lastWorkingDate: t.lastWorkingDate ?? null,
        leavingReason: t.leavingReason ?? null,
      }))
    );
  }

  if (!params.type || params.type === "EMPLOYEE") {
    const employees = await db.employee.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(params.departmentId && { departmentId: params.departmentId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      },
      orderBy: { firstName: "asc" },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        gender: true,
        email: true,
        phone: true,
        joiningDate: true,
        salary: true,
        isActive: true,
        lastWorkingDate: true,
        leavingReason: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    rows.push(
      ...employees.map((e) => ({
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        type: "Employee" as const,
        gender: e.gender,
        department: e.department?.name ?? "—",
        designation: e.designation?.name ?? "—",
        email: e.email,
        phone: e.phone,
        qualification: null,
        experience: null,
        joiningDate: e.joiningDate,
        salary: e.salary ? Number(e.salary) : null,
        isActive: e.isActive,
        lastWorkingDate: e.lastWorkingDate ?? null,
        leavingReason: e.leavingReason ?? null,
      }))
    );
  }

  return rows;
}