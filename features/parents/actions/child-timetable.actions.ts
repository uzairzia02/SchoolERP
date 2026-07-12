"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getChildTimetable(studentId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") return null;

  const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return null;

  const link = await db.studentParent.findFirst({
    where: { parentId: parent.id, studentId },
    include: {
      student: {
        include: {
          class: { select: { displayName: true } },
          section: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!link) return null; // not this parent's child

  const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  const student = link.student;
  if (!student.section) {
    const emptyTimetable: Record<
      string,
      { subject: string; teacher: string; time: string; room: string }[]
    > = {};
    for (const day of DAYS_ORDER) emptyTimetable[day] = [];

    return {
      studentName: `${student.firstName} ${student.lastName}`,
      className: student.class?.displayName ?? "N/A",
      sectionName: undefined,
      timetable: emptyTimetable,
    };
  }

  const slots = await db.timetable.findMany({
    where: { sectionId: student.section.id, isActive: true },
    include: {
      subject: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const timetable: Record<string, { subject: string; teacher: string; time: string; room: string }[]> = {};
  for (const day of DAYS_ORDER) timetable[day] = [];

  for (const slot of slots) {
    if (!timetable[slot.dayOfWeek]) timetable[slot.dayOfWeek] = [];
    timetable[slot.dayOfWeek].push({
      subject: slot.subject.name,
      teacher: `${slot.teacher.firstName} ${slot.teacher.lastName}`,
      time: `${slot.startTime} - ${slot.endTime}`,
      room: slot.room ?? "TBA",
    });
  }

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    sectionName: student.section.name,
    timetable,
  };
}