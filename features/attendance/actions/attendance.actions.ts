"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  markAttendanceSchema,
  markStaffAttendanceSchema,
} from "@/features/attendance/schemas/attendance.schema";
import type { ActionResult } from "@/types/globals.types";
import type { AttendanceStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type StudentForAttendance = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string | null;
  attendance: {
    status: AttendanceStatus;
    remarks: string | null;
  } | null;
};

export type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: number;
};

export type StaffForAttendance = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  type: "TEACHER" | "EMPLOYEE";
  department: { name: string } | null;
  attendance: {
    status: AttendanceStatus;
    remarks: string | null;
  } | null;
};

// ─────────────────────────────────────────────────────────────
// Get Students for Attendance
// ─────────────────────────────────────────────────────────────

export async function getStudentsForAttendance(params: {
  classId: string;
  sectionId?: string;
  date: string;
}): Promise<ActionResult<StudentForAttendance[]>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const attendanceDate = new Date(params.date);
  attendanceDate.setHours(0, 0, 0, 0);

  const students = await db.student.findMany({
    where: {
      schoolId,
      classId: params.classId,
      ...(params.sectionId && { sectionId: params.sectionId }),
      isActive: true,
      deletedAt: null,
    },
    orderBy: [{ rollNumber: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      rollNumber: true,
      attendance: {
        where: { date: attendanceDate },
        select: { status: true, remarks: true },
        take: 1,
      },
    },
  });

  return {
    success: true,
    data: students.map((s) => ({
      ...s,
      attendance: s.attendance[0] ?? null,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Mark Student Attendance
// ─────────────────────────────────────────────────────────────

export async function markStudentAttendanceAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = markAttendanceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { date, sectionId, records } = parsed.data;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  try {
    await db.$transaction(async (tx) => {
      for (const record of records) {
        const existing = await tx.studentAttendance.findFirst({
          where: {
            studentId: record.studentId,
            date: attendanceDate,
          },
          select: { id: true },
        });

        await tx.studentAttendance.upsert({
          where: {
            id: existing?.id ?? "new",
          },
          update: {
            status: record.status as AttendanceStatus,
            remarks: record.remarks ?? null,
          },
          create: {
            schoolId,
            studentId: record.studentId,
            sectionId: sectionId ?? null,
            date: attendanceDate,
            status: record.status as AttendanceStatus,
            remarks: record.remarks ?? null,
            createdBy: session.user.id,
          },
        });
      }
    });

    revalidatePath("/dashboard/attendance/students");
    return { success: true, data: null, message: "Attendance saved successfully." };
  } catch (error) {
    console.error("Mark attendance error:", error);
    return { success: false, error: "Failed to save attendance. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Staff for Attendance
// ─────────────────────────────────────────────────────────────

export async function getStaffForAttendance(
  date: string
): Promise<ActionResult<StaffForAttendance[]>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const [teachers, employees] = await Promise.all([
    db.teacher.findMany({
      where: { schoolId, isActive: true, deletedAt: null },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: { select: { name: true } },
        attendance: {
          where: { date: attendanceDate },
          select: { status: true, remarks: true },
          take: 1,
        },
      },
    }),
    db.employee.findMany({
      where: { schoolId, isActive: true, deletedAt: null },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        department: { select: { name: true } },
        attendance: {
          where: { date: attendanceDate },
          select: { status: true, remarks: true },
          take: 1,
        },
      },
    }),
  ]);

  const staff: StaffForAttendance[] = [
    ...teachers.map((t) => ({
      ...t,
      type: "TEACHER" as const,
      attendance: t.attendance[0] ?? null,
    })),
    ...employees.map((e) => ({
      ...e,
      type: "EMPLOYEE" as const,
      attendance: e.attendance[0] ?? null,
    })),
  ];

  return { success: true, data: staff };
}

// ─────────────────────────────────────────────────────────────
// Mark Staff Attendance
// ─────────────────────────────────────────────────────────────

export async function markStaffAttendanceAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = markStaffAttendanceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
    };
  }

  const { date, records } = parsed.data;
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  try {
    await db.$transaction(async (tx) => {
      for (const record of records) {
        const isTeacher = record.staffType === "TEACHER";

        const existing = await tx.staffAttendance.findFirst({
          where: {
            ...(isTeacher
              ? { teacherId: record.staffId }
              : { employeeId: record.staffId }),
            date: attendanceDate,
          },
          select: { id: true },
        });

        await tx.staffAttendance.upsert({
          where: { id: existing?.id ?? "new" },
          update: {
            status: record.status as AttendanceStatus,
            remarks: record.remarks ?? null,
          },
          create: {
            schoolId,
            ...(isTeacher
              ? { teacherId: record.staffId }
              : { employeeId: record.staffId }),
            date: attendanceDate,
            status: record.status as AttendanceStatus,
            remarks: record.remarks ?? null,
            createdBy: session.user.id,
          },
        });
      }
    });

    revalidatePath("/dashboard/attendance/staff");
    return {
      success: true,
      data: null,
      message: "Staff attendance saved successfully.",
    };
  } catch (error) {
    console.error("Mark staff attendance error:", error);
    return { success: false, error: "Failed to save attendance." };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Attendance Summary (for a class + date)
// ─────────────────────────────────────────────────────────────

export async function getAttendanceSummary(params: {
  classId: string;
  sectionId?: string;
  date: string;
}): Promise<AttendanceSummary> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const attendanceDate = new Date(params.date);
  attendanceDate.setHours(0, 0, 0, 0);

  const records = await db.studentAttendance.findMany({
    where: {
      schoolId,
      date: attendanceDate,
      student: {
        classId: params.classId,
        ...(params.sectionId && { sectionId: params.sectionId }),
      },
    },
    select: { status: true },
  });

  const summary = {
    present: records.filter((r) => r.status === "PRESENT").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    halfDay: records.filter((r) => r.status === "HALF_DAY").length,
    leave: records.filter((r) => r.status === "LEAVE").length,
    total: records.length,
    percentage: 0,
  };

  summary.percentage =
    summary.total > 0
      ? Math.round((summary.present / summary.total) * 100)
      : 0;

  return summary;
}

// ─────────────────────────────────────────────────────────────
// Get Monthly Attendance Report
// ─────────────────────────────────────────────────────────────

export async function getMonthlyAttendanceReport(params: {
  classId: string;
  sectionId?: string;
  month: number;
  year: number;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const startDate = new Date(params.year, params.month - 1, 1);
  const endDate = new Date(params.year, params.month, 0);

  const students = await db.student.findMany({
    where: {
      schoolId,
      classId: params.classId,
      ...(params.sectionId && { sectionId: params.sectionId }),
      isActive: true,
      deletedAt: null,
    },
    orderBy: [{ rollNumber: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      rollNumber: true,
      attendance: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
        select: { date: true, status: true },
      },
    },
  });

  return students.map((student) => {
    const present = student.attendance.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const absent = student.attendance.filter(
      (a) => a.status === "ABSENT"
    ).length;
    const late = student.attendance.filter((a) => a.status === "LATE").length;
    const total = student.attendance.length;

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      present,
      absent,
      late,
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  });
}