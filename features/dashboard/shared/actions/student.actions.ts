"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeeStatus } from "@prisma/client";

export async function getStudentStats() {
  const session = await auth();
  if (!session?.user) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      class: { select: { id: true, displayName: true } },
      section: { select: { id: true, name: true } },
    },
  });

  if (!student) return null;

  const now = new Date();
  const dayOfWeek = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase() as
    | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

  const [
    attendanceRecords,
    todayTimetable,
    upcomingExams,
    classAssignments,
    mySubmissions,
    recentGrades,
    pendingFees,
    recentAnnouncements,
  ] = await Promise.all([
    // Some Prisma schemas may use a different model name for attendance.
    // Use a dynamic lookup to support various possible model names without
    // causing a TypeScript error if a property does not exist on the client.
    (async () => {
      const attendanceModel = (db as any).attendanceRecord ?? (db as any).attendance ?? (db as any).attendanceRecords ?? (db as any).attendance_records;
      if (!attendanceModel) return [];
      return attendanceModel.findMany({ where: { studentId: student.id }, select: { status: true } });
    })(),

    student.section
      ? db.timetable.findMany({
          where: { sectionId: student.section.id, dayOfWeek, isActive: true },
          include: {
            subject: { select: { name: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
          orderBy: { id: "asc" },
        })
      : Promise.resolve([]),

    student.class
      ? db.exam.findMany({
          where: { classId: student.class.id, isPublished: true, startDate: { gte: now } },
          orderBy: { startDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),

    student.class
      ? db.assignment.findMany({
          where: { classId: student.class.id, isActive: true, dueDate: { gte: now } },
          include: { subject: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
          take: 10,
        })
      : Promise.resolve([]),

    db.assignmentSubmission.findMany({
      where: { studentId: student.id },
      select: { assignmentId: true },
    }),

    db.grade.findMany({
      where: { studentId: student.id },
      include: {
        subject: { select: { name: true } },
        exam: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    db.fee.findMany({
      where: {
        studentId: student.id,
        status: { in: [FeeStatus.UNPAID, FeeStatus.PARTIAL, FeeStatus.OVERDUE] },
      },
      include: { feeType: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),

    db.announcement.findMany({
      where: { schoolId: student.schoolId, isActive: true, targetRoles: { hasSome: ["STUDENT"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const submittedIds = new Set(mySubmissions.map((s) => s.assignmentId));
  const pendingAssignments = classAssignments.filter((a) => !submittedIds.has(a.id));

  const presentCount = attendanceRecords.filter((a: typeof attendanceRecords[0]) => a.status === "PRESENT").length;
  const attendancePercentage =
    attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

  const totalOutstanding = pendingFees.reduce(
    (sum, f) => sum + Number(f.amount) + Number(f.fine) - Number(f.discount) - Number(f.paidAmount),
    0
  );

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    sectionName: student.section?.name ?? "N/A",
    attendancePercentage,
    todayClasses: todayTimetable.map((t) => ({
      id: t.id,
      subject: t.subject.name,
      teacher: `${t.teacher.firstName} ${t.teacher.lastName}`,
      time: `${t.startTime} - ${t.endTime}`,
      room: t.room ?? "TBA",
    })),
    upcomingExams: upcomingExams.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      date: e.startDate,
    })),
    pendingAssignments: pendingAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject.name,
      dueDate: a.dueDate,
    })),
    recentGrades: recentGrades.map((g) => ({
      id: g.id,
      subject: g.subject.name,
      examName: g.exam.name,
      marksObt: Number(g.marksObt),
      totalMarks: Number(g.totalMarks),
      grade: g.grade,
    })),
    pendingFees: pendingFees.map((f) => ({
      id: f.id,
      feeType: f.feeType.name,
      amount: Number(f.amount) + Number(f.fine) - Number(f.discount) - Number(f.paidAmount),
      dueDate: f.dueDate,
      status: f.status,
    })),
    totalOutstandingFees: totalOutstanding,
    recentAnnouncements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
    })),
  };
}
