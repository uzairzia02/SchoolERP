"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// Principal Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getPrincipalStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalStudents, activeStudents, totalTeachers, totalEmployees,
    todayStudentAttendance, totalStudentAttendanceToday,
    todayStaffAttendance, totalStaffAttendanceToday,
    pendingLeaves, pendingAdmissions,
    unpaidFees, totalFees,
    upcomingExams, recentAnnouncements,
    lowAttendanceStudents,
  ] = await Promise.all([
    db.student.count({ where: { schoolId, deletedAt: null } }),
    db.student.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.teacher.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.employee.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.studentAttendance.count({ where: { schoolId, date: today, status: "PRESENT" } }),
    db.studentAttendance.count({ where: { schoolId, date: today } }),
    db.staffAttendance.count({ where: { schoolId, date: today, status: "PRESENT", OR: [{ teacherId: { not: null } }, { employeeId: { not: null } }] } }),
    db.staffAttendance.count({ where: { schoolId, date: today, OR: [{ teacherId: { not: null } }, { employeeId: { not: null } }] } }),
    db.leave.count({ where: { schoolId, status: "PENDING" } }),
    db.admission.count({ where: { schoolId, status: { in: ["APPLIED", "UNDER_REVIEW"] } } }),
    db.fee.count({ where: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } } }),
    db.fee.count({ where: { schoolId } }),
    db.exam.findMany({
      where: { schoolId, startDate: { gte: today }, deletedAt: null },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { id: true, name: true, type: true, startDate: true, class: { select: { displayName: true } } },
    }),
    db.announcement.findMany({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, createdAt: true, targetRoles: true },
    }),
    // Students with attendance < 75% this month
    db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT s.id) as count
      FROM students s
      JOIN attendance a ON a."studentId" = s.id
      WHERE s."schoolId" = ${schoolId}
        AND s."deletedAt" IS NULL
        AND s."isActive" = true
        AND a.date >= date_trunc('month', CURRENT_DATE)
      GROUP BY s.id
      HAVING (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END)::float / COUNT(a.id)) < 0.75
    `.then((r) => Number(r[0]?.count ?? 0)).catch(() => 0),
  ]);

  return {
    totalStudents,
    activeStudents,
    totalTeachers,
    totalEmployees,
    studentAttendanceRate: totalStudentAttendanceToday > 0
      ? Math.round((todayStudentAttendance / totalStudentAttendanceToday) * 100)
      : 0,
    staffAttendanceRate: totalStaffAttendanceToday > 0
      ? Math.round((todayStaffAttendance / totalStaffAttendanceToday) * 100)
      : 0,
    pendingLeaves,
    pendingAdmissions,
    feeCollectionRate: totalFees > 0
      ? Math.round(((totalFees - unpaidFees) / totalFees) * 100)
      : 0,
    unpaidFees,
    upcomingExams,
    recentAnnouncements,
    lowAttendanceStudents,
  };
}

// ─────────────────────────────────────────────────────────────
// HR Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getHRStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [
    totalTeachers, activeTeachers, inactiveTeachers,
    totalEmployees, activeEmployees,
    pendingLeaves, approvedLeavesThisMonth,
    todayStaffPresent, totalStaffToday,
    payrollProcessedThisMonth, totalStaffOnPayroll,
    departments, recentLeaves,
    // 🔥 Naya: Staff attendance detail
    staffAttendanceToday,
  ] = await Promise.all([
    db.teacher.count({ where: { schoolId, deletedAt: null } }),
    db.teacher.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.teacher.count({ where: { schoolId, isActive: false, deletedAt: null } }),
    db.employee.count({ where: { schoolId, deletedAt: null } }),
    db.employee.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.leave.count({ where: { schoolId, status: "PENDING" } }),
    db.leave.count({
      where: {
        schoolId, status: "APPROVED",
        startDate: { gte: new Date(currentYear, currentMonth - 1, 1) },
      },
    }),
    db.staffAttendance.count({ where: { schoolId, date: today, status: "PRESENT", OR: [{ teacherId: { not: null } }, { employeeId: { not: null } }] } }),
    db.staffAttendance.count({ where: { schoolId, date: today, OR: [{ teacherId: { not: null } }, { employeeId: { not: null } }] } }),
    db.payroll.count({ where: { schoolId, month: currentMonth, year: currentYear } }),
    db.employee.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.department.findMany({
      where: { schoolId, isActive: true, deletedAt: null },
      select: {
        id: true, name: true,
        _count: {
          select: {
            teachers: { where: { deletedAt: null, isActive: true } },
            employees: { where: { deletedAt: null, isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.leave.findMany({
      where: { schoolId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, type: true, startDate: true, endDate: true, totalDays: true, status: true,
        teacher: { select: { firstName: true, lastName: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
    }),
    // 🔥 Staff attendance detail query (Promise.all ke andar)
    db.staffAttendance.findMany({
      where: {
        schoolId,
        date: today,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    totalTeachers, activeTeachers, inactiveTeachers,
    totalEmployees, activeEmployees,
    totalStaff: activeTeachers + activeEmployees,
    pendingLeaves, approvedLeavesThisMonth,
    staffAttendanceRate: totalStaffToday > 0
      ? Math.round((todayStaffPresent / totalStaffToday) * 100)
      : 0,
    payrollProgress: `${payrollProcessedThisMonth}/${totalStaffOnPayroll}`,
    payrollProcessedThisMonth, totalStaffOnPayroll,
    departments,
    recentLeaves,
    staffAttendanceToday,  // 🔥 Return mein add karo
  };
}

// ─────────────────────────────────────────────────────────────
// Accountant Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getAccountantStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const monthStart = new Date(currentYear, currentMonth - 1, 1);

  const [
    totalFeesAgg, collectedFeesAgg, unpaidCount, overdueCount, partialCount,
    thisMonthCollectedAgg, todayCollectedAgg,
    payrollThisMonthAgg, unpaidPayroll,
    recentPayments, overdueList,
  ] = await Promise.all([
    db.fee.aggregate({ where: { schoolId }, _sum: { amount: true } }),
    db.fee.aggregate({ where: { schoolId, status: "PAID" }, _sum: { paidAmount: true } }),
    db.fee.count({ where: { schoolId, status: "UNPAID" } }),
    db.fee.count({ where: { schoolId, status: "OVERDUE" } }),
    db.fee.count({ where: { schoolId, status: "PARTIAL" } }),
    db.fee.aggregate({
      where: { schoolId, status: "PAID", paidDate: { gte: monthStart } },
      _sum: { paidAmount: true },
    }),
    db.fee.aggregate({
      where: { schoolId, status: "PAID", paidDate: { gte: today } },
      _sum: { paidAmount: true },
    }),
    db.payroll.aggregate({
      where: { schoolId, month: currentMonth, year: currentYear },
      _sum: { netSalary: true },
      _count: { id: true },
    }),
    db.employee.count({ where: { schoolId, isActive: true, deletedAt: null } }),
    db.fee.findMany({
      where: { schoolId, status: "PAID", paidDate: { not: null } },
      orderBy: { paidDate: "desc" },
      take: 5,
      select: {
        id: true, amount: true, paidAmount: true, paidDate: true,
        paymentMethod: true, receiptNumber: true,
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        feeType: { select: { name: true } },
      },
    }),
    db.fee.findMany({
      where: { schoolId, status: "OVERDUE" },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true, amount: true, paidAmount: true, dueDate: true,
        student: { select: { firstName: true, lastName: true, admissionNumber: true, class: { select: { name: true } } } },
        feeType: { select: { name: true } },
      },
    }),
  ]);

  const totalFees = Number(totalFeesAgg._sum.amount ?? 0);
  const collectedFees = Number(collectedFeesAgg._sum.paidAmount ?? 0);

  return {
    totalFees,
    collectedFees,
    pendingFees: totalFees - collectedFees,
    collectionRate: totalFees > 0 ? Math.round((collectedFees / totalFees) * 100) : 0,
    unpaidCount, overdueCount, partialCount,
    thisMonthCollected: Number(thisMonthCollectedAgg._sum.paidAmount ?? 0),
    todayCollected: Number(todayCollectedAgg._sum.paidAmount ?? 0),
    payrollThisMonth: Number(payrollThisMonthAgg._sum.netSalary ?? 0),
    payrollProcessed: payrollThisMonthAgg._count.id,
    payrollPending: unpaidPayroll - payrollThisMonthAgg._count.id,
    recentPayments: recentPayments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paidAmount: Number(p.paidAmount),
    })),
    overdueList: overdueList.map((f) => ({
      ...f,
      amount: Number(f.amount),
      paidAmount: Number(f.paidAmount),
      balance: Number(f.amount) - Number(f.paidAmount),
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Teacher Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getTeacherStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id, schoolId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      subjects: {
        select: { subject: { select: { id: true, name: true, code: true } } },
      },
    },
  });

  if (!teacher) return null;

  const fullTimetable = await db.timetable.findMany({
    where: { schoolId, teacherId: teacher.id, isActive: true },
    select: { classId: true, sectionId: true },
    distinct: ["classId", "sectionId"],
  });

  const totalClasses = fullTimetable.length;
  const totalStudents =
    fullTimetable.length === 0
      ? 0
      : await db.student.count({
          where: {
            schoolId,
            deletedAt: null,
            OR: fullTimetable.map((t) => ({ classId: t.classId, sectionId: t.sectionId ?? undefined })),
          },
        });

  const [
    myTimetableToday,
    pendingLeave, myLeaves,
    upcomingExams,
    todayAttendance, pendingAssignments,
    myAnnouncements,
  ] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        teacherId: teacher.id,
        dayOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"][today.getDay() === 0 ? 6 : today.getDay() - 1] as any,
        isActive: true,
      },
      orderBy: {
        period: { startTime: "asc" },
      },
      select: {
        id: true,
        room: true,
        class: { select: { displayName: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        period: { select: { startTime: true, endTime: true } },
      },
    }),
    db.leave.count({ where: { schoolId, teacherId: teacher.id, status: "PENDING" } }),
    db.leave.findMany({
      where: { schoolId, teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, type: true, startDate: true, endDate: true, totalDays: true, status: true },
    }),
    db.exam.findMany({
      where: { schoolId, startDate: { gte: today }, deletedAt: null },
      orderBy: { startDate: "asc" },
      take: 4,
      select: { id: true, name: true, type: true, startDate: true, class: { select: { displayName: true } } },
    }),
    db.staffAttendance.count({
      where: { schoolId, date: today, teacherId: teacher.id },
    }),
    db.assignment.count({
      where: { schoolId, teacherId: teacher.id, dueDate: { gte: today } },
    }),
    db.announcement.findMany({
      where: {
        schoolId, isActive: true,
        targetRoles: { has: "TEACHER" as any },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
  ]);

  return {
    teacher,
    mySubjectsCount: teacher.subjects.length,
    totalClasses,
    totalStudents,
    myTimetableToday,
    periodsToday: myTimetableToday.length,
    pendingLeave,
    myLeaves,
    upcomingExams,
    isAttendanceMarkedToday: todayAttendance > 0,
    pendingAssignments,
    myAnnouncements,
  };
}

// ─────────────────────────────────────────────────────────────
// Student Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getStudentStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const student = await db.student.findFirst({
    where: { userId: session.user.id, schoolId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true,
      admissionNumber: true, rollNumber: true,
      class: { select: { id: true, name: true, displayName: true } },
      section: { select: { id: true, name: true } },
    },
  });

  if (!student) return null;

  const [
    myAttendance, totalAttendanceDays,
    pendingFees, totalFees,
    upcomingExams, myGrades,
    pendingAssignments, timetableToday,
    myAnnouncements,
  ] = await Promise.all([
    db.studentAttendance.count({
      where: { schoolId, studentId: student.id, status: "PRESENT", date: { gte: monthStart } },
    }),
    db.studentAttendance.count({
      where: { schoolId, studentId: student.id, date: { gte: monthStart } },
    }),
    db.fee.findMany({
      where: { schoolId, studentId: student.id, status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
      select: { id: true, amount: true, paidAmount: true, dueDate: true, status: true, feeType: { select: { name: true } } },
    }),
    db.fee.count({ where: { schoolId, studentId: student.id } }),
    db.exam.findMany({
      where: { schoolId, classId: student.class?.id, startDate: { gte: today }, deletedAt: null },
      orderBy: { startDate: "asc" },
      take: 3,
      select: { id: true, name: true, type: true, startDate: true, endDate: true },
    }),
    db.grade.findMany({
      where: { schoolId, studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, marksObt: true, totalMarks: true, percentage: true, grade: true,
        subject: { select: { name: true, code: true } },
        exam: { select: { name: true, type: true } },
      },
    }),
    db.assignment.count({
      where: { schoolId, dueDate: { gte: today }, classId: student.class?.id },
    }),
    student.class?.id
      ? db.timetable.findMany({
          where: {
            schoolId,
            classId: student.class.id,
            sectionId: student.section?.id,
            isActive: true,
            dayOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"][
              today.getDay() === 0 ? 6 : today.getDay() - 1
            ] as any,
          },
            orderBy: { period: { startTime: "asc" } },
              select: {
                id: true,
                room: true,
                subject: { select: { name: true, code: true } },
                teacher: { select: { firstName: true, lastName: true } },
                period: { select: { startTime: true, endTime: true } },
              },
        })
      : Promise.resolve([]),
    db.announcement.findMany({
      where: { schoolId, isActive: true, targetRoles: { has: "STUDENT" as any } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
  ]);

  const attendanceRate =
    totalAttendanceDays > 0
      ? Math.round((myAttendance / totalAttendanceDays) * 100)
      : 0;

  const totalPendingAmount = pendingFees.reduce(
    (s, f) => s + (Number(f.amount) - Number(f.paidAmount)), 0
  );

  return {
    student,
    attendanceRate,
    presentDays: myAttendance,
    totalDays: totalAttendanceDays,
    pendingFees: pendingFees.map((f) => ({ ...f, amount: Number(f.amount), paidAmount: Number(f.paidAmount) })),
    totalPendingAmount,
    upcomingExams,
    myGrades: myGrades.map((g) => ({
      ...g,
      marksObt: Number(g.marksObt),
      totalMarks: Number(g.totalMarks),
      percentage: Number(g.percentage),
    })),
    pendingAssignments,
    timetableToday,
    myAnnouncements,
  };
}

// ─────────────────────────────────────────────────────────────
// Parent Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getParentStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const parent = await db.parent.findFirst({
    where: { userId: session.user.id, schoolId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true,
      students: {
        select: {
          relation: true,
          student: {
            select: {
              id: true, firstName: true, lastName: true,
              admissionNumber: true, rollNumber: true, isActive: true,
              class: { select: { displayName: true } },
              section: { select: { name: true } },
              attendance: {
                where: { date: { gte: monthStart } },
                select: { status: true, date: true },
              },
              fees: {
                where: { status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
                select: {
                  id: true, amount: true, paidAmount: true, dueDate: true, status: true,
                  feeType: { select: { name: true } },
                },
              },
              grades: {
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                  marksObt: true, totalMarks: true, percentage: true, grade: true,
                  subject: { select: { name: true } },
                  exam: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const myAnnouncements = await db.announcement.findMany({
    where: { schoolId, isActive: true, targetRoles: { has: "PARENT" as any } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, title: true, content: true, createdAt: true },
  });

  const children = parent.students.map(({ student, relation }) => {
    const present = student.attendance.filter((a) => a.status === "PRESENT").length;
    const total = student.attendance.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    const pendingFees = student.fees.map((f) => ({
      ...f,
      amount: Number(f.amount),
      paidAmount: Number(f.paidAmount),
      balance: Number(f.amount) - Number(f.paidAmount),
    }));

    return {
      relation,
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      isActive: student.isActive,
      className: student.class?.displayName ?? "—",
      sectionName: student.section?.name ?? "—",
      attendanceRate,
      presentDays: present,
      totalDays: total,
      absentDays: student.attendance.filter((a) => a.status === "ABSENT").length,
      pendingFees,
      totalPending: pendingFees.reduce((s, f) => s + f.balance, 0),
      grades: student.grades.map((g) => ({
        ...g,
        marksObt: Number(g.marksObt),
        totalMarks: Number(g.totalMarks),
        percentage: Number(g.percentage),
      })),
    };
  });

  return { parent, children, myAnnouncements };
}

// ─────────────────────────────────────────────────────────────
// Staff Dashboard (HR + Accountant + Faculty generic)
// ─────────────────────────────────────────────────────────────

export async function getStaffStats() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const employee = await db.employee.findFirst({
    where: { userId: session.user.id, schoolId, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, employeeId: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
    },
  });

  if (!employee) return null;

  const [
    myAttendanceThisMonth, totalWorkingDays,
    myLeaves, pendingLeave,
    myPayroll,
    myAnnouncements,
  ] = await Promise.all([
    db.staffAttendance.count({
      where: {
        schoolId, employeeId: employee.id, status: "PRESENT",
        date: { gte: new Date(currentYear, currentMonth - 1, 1) },
      },
    }),
    db.staffAttendance.count({
      where: {
        schoolId, employeeId: employee.id,
        date: { gte: new Date(currentYear, currentMonth - 1, 1) },
      },
    }),
    db.leave.findMany({
      where: { schoolId, employeeId: employee.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, startDate: true, endDate: true, totalDays: true, status: true, reason: true },
    }),
    db.leave.count({ where: { schoolId, employeeId: employee.id, status: "PENDING" } }),
    db.payroll.findFirst({
      where: { schoolId, employeeId: employee.id, month: currentMonth, year: currentYear },
      select: { netSalary: true, paidDate: true, paymentMethod: true, basicSalary: true, allowances: true, deductions: true },
    }),
    db.announcement.findMany({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
  ]);

  return {
    employee,
    attendanceRate: totalWorkingDays > 0
      ? Math.round((myAttendanceThisMonth / totalWorkingDays) * 100)
      : 0,
    presentDays: myAttendanceThisMonth,
    totalWorkingDays,
    myLeaves,
    pendingLeave,
    myPayroll: myPayroll
      ? {
          netSalary: Number(myPayroll.netSalary),
          basicSalary: Number(myPayroll.basicSalary),
          allowances: Number(myPayroll.allowances),
          deductions: Number(myPayroll.deductions),
          paidDate: myPayroll.paidDate,
          paymentMethod: myPayroll.paymentMethod,
        }
      : null,
    myAnnouncements,
  };
}