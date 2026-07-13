"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSuperAdminStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const [
    totalStudents,
    totalTeachers,
    totalEmployees,
    totalParents,
    todayAttendance,
    totalAttendanceToday,
    pendingLeaves,
    pendingAdmissions,
    monthlyFees,
    unpaidFees,
    recentStudents,
    upcomingEvents,
  ] = await Promise.all([
    // Total students
    db.student.count({
      where: { schoolId, isActive: true, deletedAt: null },
    }),

    // Total teachers
    db.teacher.count({
      where: { schoolId, isActive: true, deletedAt: null },
    }),

    // Total employees
    db.employee.count({
      where: { schoolId, isActive: true, deletedAt: null },
    }),

    // Total parents
    db.parent.count({
      where: { schoolId, isActive: true, deletedAt: null },
    }),

    // Today present students
    db.studentAttendance.count({
      where: {
        schoolId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        status: "PRESENT",
      },
    }),

    // Today total attendance marked
    db.studentAttendance.count({
      where: {
        schoolId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    }),

    // Pending leave requests
    db.leave.count({
      where: { schoolId, status: "PENDING" },
    }),

    // Pending admissions
    db.admission.count({
      where: { schoolId, status: "APPLIED" },
    }),

    // This month collected fees
    db.fee.aggregate({
      where: {
        schoolId,
        status: "PAID",
        paidDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { paidAmount: true },
    }),

    // Unpaid fees total
    db.fee.aggregate({
      where: {
        schoolId,
        status: { in: ["UNPAID", "OVERDUE"] },
      },
      _sum: { amount: true },
    }),

    // Recent admissions (last 5 students)
    db.student.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        createdAt: true,
        class: { select: { name: true } },
      },
    }),

    // Upcoming events
    db.event.findMany({
      where: {
        schoolId,
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: 4,
      select: {
        id: true,
        title: true,
        startDate: true,
        location: true,
      },
    }),
  ]);

  const attendanceRate =
    totalAttendanceToday > 0
      ? Math.round((todayAttendance / totalAttendanceToday) * 100)
      : 0;

  return {
    stats: {
      totalStudents,
      totalTeachers,
      totalEmployees,
      totalParents,
      attendanceRate,
      pendingLeaves,
      pendingAdmissions,
      monthlyFees: Number(monthlyFees._sum.paidAmount ?? 0),
      unpaidFees: Number(unpaidFees._sum.amount ?? 0),
    },
    recentStudents,
    upcomingEvents,
  };
}

export async function getMonthlyEnrollment() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const year = new Date().getFullYear();

  const students = await db.student.findMany({
    where: {
      schoolId,
      deletedAt: null,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    select: { createdAt: true },
  });

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const data = months.map((month, index) => ({
    month,
    students: students.filter(
      (s) => new Date(s.createdAt).getMonth() === index
    ).length,
  }));

  return data;
}

export async function getMonthlyFeeCollection() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const year = new Date().getFullYear();

  const fees = await db.fee.findMany({
    where: {
      schoolId,
      status: "PAID",
      paidDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    select: { paidAmount: true, paidDate: true },
  });

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const data = months.map((month, index) => ({
    month,
    collected: fees
      .filter((f) => f.paidDate && new Date(f.paidDate).getMonth() === index)
      .reduce((sum, f) => sum + Number(f.paidAmount ?? 0), 0),
  }));

  return data;
}