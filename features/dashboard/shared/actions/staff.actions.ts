"use server";

import { auth } from "../../../../lib/auth";
import { db } from "@/lib/db";

export async function getStaffStats() {
  const session = await auth();
  if (!session?.user) return null;

  const employee = await db.employee.findUnique({
    where: { userId: session.user.id },
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  });

  if (!employee) return null;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  const [attendanceToday, myLeaveRequests, latestPayroll, upcomingHolidays, recentAnnouncements] =
    await Promise.all([
      db.attendance.findFirst({
        where: { employeeId: employee.id, date: { gte: startOfDay, lte: endOfDay } },
      }),

      db.leave.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      db.payroll.findFirst({
        where: { employeeId: employee.id, month: currentMonth, year: currentYear },
      }),

      db.holiday.findMany({
        where: { schoolId: employee.schoolId, date: { gte: now } },
        orderBy: { date: "asc" },
        take: 5,
      }),

      db.announcement.findMany({
        where: {
          schoolId: employee.schoolId,
          isActive: true,
          targetRoles: { hasSome: [session.user.role] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    employeeName: `${employee.firstName} ${employee.lastName}`,
    department: employee.department?.name ?? "N/A",
    designation: employee.designation?.name ?? "N/A",
    attendanceMarkedToday: !!attendanceToday,
    myLeaveRequests: myLeaveRequests.map((l) => ({
      id: l.id,
      type: l.type,
      fromDate: l.startDate,
      toDate: l.endDate,
      status: l.status,
    })),
    latestPayroll: latestPayroll
      ? {
          month: latestPayroll.month,
          year: latestPayroll.year,
          netSalary: Number(latestPayroll.netSalary),
          paidDate: latestPayroll.paidDate,
        }
      : null,
    upcomingHolidays: upcomingHolidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date,
    })),
    recentAnnouncements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
    })),
  };
}

