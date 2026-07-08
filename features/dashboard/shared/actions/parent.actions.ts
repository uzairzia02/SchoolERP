"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeeStatus } from "@prisma/client";

export async function getParentStats() {
  const session = await auth();
  if (!session?.user) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              class: { select: { displayName: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  const now = new Date();

  const children = await Promise.all(
    parent.students.map(async ({ student, relation }) => {
      const [attendanceRecords, outstandingFees, upcomingExamCount] = await Promise.all([
        db.attendance.findMany({
          where: { studentId: student.id },
          select: { status: true },
        }),

        db.fee.findMany({
          where: {
            studentId: student.id,
            status: { in: [FeeStatus.UNPAID, FeeStatus.PARTIAL, FeeStatus.OVERDUE] },
          },
          select: { amount: true, fine: true, discount: true, paidAmount: true },
        }),

        student.class
          ? db.exam.count({
              where: {
                classId: student.class.id,
                isPublished: true,
                startDate: { gte: now },
              },
            })
          : 0,
      ]);

      const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
      const attendancePercentage =
        attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 0;

      const outstandingTotal = outstandingFees.reduce(
        (sum, f) =>
          sum + Number(f.amount) + Number(f.fine) - Number(f.discount) - Number(f.paidAmount),
        0
      );

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        relation,
        className: student.class?.displayName ?? "N/A",
        sectionName: student.section?.name ?? "N/A",
        photo: student.photo,
        attendancePercentage,
        outstandingFees: outstandingTotal,
        upcomingExamCount,
      };
    })
  );

  const recentAnnouncements = await db.announcement.findMany({
    where: { schoolId: parent.schoolId, isActive: true, targetRoles: { hasSome: ["PARENT"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    parentName: `${parent.firstName} ${parent.lastName}`,
    children,
    totalOutstandingFees: children.reduce((sum, c) => sum + c.outstandingFees, 0),
    recentAnnouncements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
    })),
  };
}
