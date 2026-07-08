"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeaveStatus } from "@prisma/client";

export async function getHRStats() {
  const session = await auth();
  if (!session?.user) return null;

  const schoolId = session.user.schoolId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalTeachers,
    totalEmployees,
    departments,
    pendingLeaves,
    newJoiningsTeachers,
    newJoiningsEmployees,
    recentLeaversTeachers,
    recentLeaversEmployees,
    pendingDocuments,
    recentAnnouncements,
  ] = await Promise.all([
    db.teacher.count({ where: { schoolId, isActive: true } }),
    db.employee.count({ where: { schoolId, isActive: true } }),

    db.department.findMany({
      where: { schoolId, isActive: true },
      include: {
        _count: { select: { teachers: true, employees: true } },
      },
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

    db.teacher.count({
      where: { schoolId, joiningDate: { gte: startOfMonth, lte: endOfMonth } },
    }),
    db.employee.count({
      where: { schoolId, joiningDate: { gte: startOfMonth, lte: endOfMonth } },
    }),

    db.teacher.findMany({
      where: { schoolId, isActive: false, lastWorkingDate: { not: null } },
      orderBy: { lastWorkingDate: "desc" },
      take: 3,
    }),
    db.employee.findMany({
      where: { schoolId, isActive: false, lastWorkingDate: { not: null } },
      orderBy: { lastWorkingDate: "desc" },
      take: 3,
    }),

    db.document.count({ where: { schoolId, isVerified: false } }),

    db.announcement.findMany({
      where: { schoolId, isActive: true, targetRoles: { hasSome: ["HR"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const departmentHeadcount = departments.map((d) => ({
    id: d.id,
    name: d.name,
    count: d._count.teachers + d._count.employees,
  }));

  const recentLeavers = [
    ...recentLeaversTeachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      type: "Teacher",
      lastWorkingDate: t.lastWorkingDate,
      reason: t.leavingReason,
    })),
    ...recentLeaversEmployees.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      type: "Employee",
      lastWorkingDate: e.lastWorkingDate,
      reason: e.leavingReason,
    })),
  ]
    .sort((a, b) => (b.lastWorkingDate?.getTime() ?? 0) - (a.lastWorkingDate?.getTime() ?? 0))
    .slice(0, 5);

  return {
    totalStaff: totalTeachers + totalEmployees,
    totalTeachers,
    totalEmployees,
    departmentHeadcount,
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
    newJoiningsThisMonth: newJoiningsTeachers + newJoiningsEmployees,
    recentLeavers,
    pendingDocumentVerification: pendingDocuments,
    recentAnnouncements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
    })),
  };
}
