"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeaveStatus, FeeStatus } from "@prisma/client";

export async function getPrincipalStats() {
  const session = await auth();
  if (!session?.user) return null;

  const schoolId = session.user.schoolId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  const [
    totalStudents,
    totalTeachers,
    totalEmployees,
    totalClasses,
    attendanceToday,
    pendingLeaves,
    feeCollectedThisMonth,
    outstandingFees,
    recentAdmissions,
    upcomingExams,
    recentAnnouncements,
  ] = await Promise.all([
    db.student.count({ where: { schoolId, isActive: true } }),
    db.teacher.count({ where: { schoolId, isActive: true } }),
    db.employee.count({ where: { schoolId, isActive: true } }),
    db.class.count({ where: { schoolId, isActive: true } }),

    db.attendance.groupBy({
      by: ["status"],
      where: {
        schoolId,
        date: { gte: startOfDay, lte: endOfDay },
        studentId: { not: null },
      },
      _count: true,
    }),

    db.leave.findMany({
      where: { schoolId, status: LeaveStatus.PENDING },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

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

    db.admission.findMany({
      where: { schoolId },
      orderBy: { appliedAt: "desc" },
      take: 5,
    }),

    db.exam.findMany({
      where: { schoolId, isPublished: true, startDate: { gte: now } },
      include: { class: { select: { displayName: true } } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),

    db.announcement.findMany({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const presentCount =
    attendanceToday.find((a) => a.status === "PRESENT")?._count ?? 0;
  const totalMarkedToday = attendanceToday.reduce((sum, a) => sum + a._count, 0);

  const outstandingTotal = outstandingFees.reduce(
    (sum, f) =>
      sum +
      Number(f.amount) +
      Number(f.fine) -
      Number(f.discount) -
      Number(f.paidAmount),
    0
  );

  return {
    totalStudents,
    totalTeachers,
    totalEmployees,
    totalClasses,
    attendanceToday: {
      present: presentCount,
      totalMarked: totalMarkedToday,
      percentage: totalMarkedToday > 0 ? Math.round((presentCount / totalMarkedToday) * 100) : 0,
    },
    pendingLeaves: pendingLeaves.map((l) => ({
      id: l.id,
      name: l.teacher
        ? `${l.teacher.firstName} ${l.teacher.lastName}`
        : l.employee
        ? `${l.employee.firstName} ${l.employee.lastName}`
        : "Unknown",
      type: l.type,
      fromDate: l.startDate,
      toDate: l.endDate,
      status: l.status,
    })),
    feeCollectedThisMonth: Number(feeCollectedThisMonth._sum.paidAmount ?? 0),
    outstandingFees: outstandingTotal,
    recentAdmissions: recentAdmissions.map((a) => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      applyingForClass: a.applyingForClass,
      status: a.status,
      appliedAt: a.appliedAt,
    })),
    upcomingExams: upcomingExams.map((e) => ({
      id: e.id,
      name: e.name,
      className: e.class.displayName,
      date: e.startDate,
      type: e.type,
    })),
    recentAnnouncements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
    })),
  };
}