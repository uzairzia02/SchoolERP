"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types/globals.types";
import type { DayOfWeek } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TimetableSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  isActive: boolean;
  class: { id: string; name: string; displayName: string };
  section: { id: string; name: string } | null;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string; employeeId: string };
};

export type WeeklyTimetable = Record<DayOfWeek, TimetableSlot[]>;

const DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];

const timetableSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Get Timetable (by class/section or teacher)
// ─────────────────────────────────────────────────────────────

export async function getTimetable(params: {
  classId?: string;
  sectionId?: string;
  teacherId?: string;
}): Promise<WeeklyTimetable> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      isActive: true,
      ...(params.classId && { classId: params.classId }),
      ...(params.sectionId && { sectionId: params.sectionId }),
      ...(params.teacherId && { teacherId: params.teacherId }),
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      room: true,
      isActive: true,
      class: { select: { id: true, name: true, displayName: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: {
        select: { id: true, firstName: true, lastName: true, employeeId: true },
      },
    },
  });

  // Group by day
  const weekly: WeeklyTimetable = {} as WeeklyTimetable;
  DAYS.forEach((day) => {
    weekly[day] = slots.filter((s) => s.dayOfWeek === day) as TimetableSlot[];
  });

  return weekly;
}

// ─────────────────────────────────────────────────────────────
// Get All Timetable Slots (for management)
// ─────────────────────────────────────────────────────────────

export async function getTimetableSlots(params: {
  classId?: string;
  teacherId?: string;
}): Promise<TimetableSlot[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return db.timetable.findMany({
    where: {
      schoolId: session.user.schoolId,
      isActive: true,
      ...(params.classId && { classId: params.classId }),
      ...(params.teacherId && { teacherId: params.teacherId }),
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      room: true,
      isActive: true,
      class: { select: { id: true, name: true, displayName: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: {
        select: { id: true, firstName: true, lastName: true, employeeId: true },
      },
    },
  }) as unknown as TimetableSlot[];
}

// ─────────────────────────────────────────────────────────────
// Create Timetable Slot
// ─────────────────────────────────────────────────────────────

export async function createTimetableSlotAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = timetableSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // Check teacher conflict — same teacher, same day, overlapping time
  const teacherConflict = await db.timetable.findFirst({
    where: {
      schoolId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      isActive: true,
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
        {
          startTime: { gte: data.startTime },
          endTime: { lte: data.endTime },
        },
      ],
    },
  });

  if (teacherConflict) {
    return {
      success: false,
      error: "Teacher has a conflicting class at this time slot.",
    };
  }

  // Check class/section conflict
  const classConflict = await db.timetable.findFirst({
    where: {
      schoolId,
      classId: data.classId,
      ...(data.sectionId && { sectionId: data.sectionId }),
      dayOfWeek: data.dayOfWeek,
      isActive: true,
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
        {
          startTime: { gte: data.startTime },
          endTime: { lte: data.endTime },
        },
      ],
    },
  });

  if (classConflict) {
    return {
      success: false,
      error: "This class already has a subject scheduled at this time.",
    };
  }

  const slot = await db.timetable.create({
    data: {
      schoolId,
      classId: data.classId,
      sectionId: data.sectionId || null,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || null,
    },
  });

  revalidatePath("/dashboard/timetable");
  return {
    success: true,
    data: { id: slot.id },
    message: "Timetable slot added.",
  };
}

// ─────────────────────────────────────────────────────────────
// Delete Timetable Slot
// ─────────────────────────────────────────────────────────────

export async function deleteTimetableSlotAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.timetable.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive: false },
  });

  revalidatePath("/dashboard/timetable");
  return { success: true, data: null, message: "Slot removed." };
}

// ─────────────────────────────────────────────────────────────
// Get Teacher's Timetable (for logged-in teacher)
// ─────────────────────────────────────────────────────────────

export async function getMyTimetable(): Promise<WeeklyTimetable> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id, schoolId, deletedAt: null },
    select: { id: true },
  });

  if (!teacher) return {} as WeeklyTimetable;

  return getTimetable({ teacherId: teacher.id });
}

// ─────────────────────────────────────────────────────────────
// Get Student's Timetable (for logged-in student)
// ─────────────────────────────────────────────────────────────

export async function getStudentTimetable(): Promise<WeeklyTimetable> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const student = await db.student.findFirst({
    where: { userId: session.user.id, schoolId, deletedAt: null },
    select: { classId: true, sectionId: true },
  });

  if (!student?.classId) return {} as WeeklyTimetable;

  return getTimetable({
    classId: student.classId,
    sectionId: student.sectionId ?? undefined,
  });
}