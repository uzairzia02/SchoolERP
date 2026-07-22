"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  classSchema,
  classUpdateSchema,
  sectionSchema,
  sectionUpdateSchema,
} from "@/features/classes/schemas/class.schema";
import type { ActionResult } from "@/types/globals.types";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ClassListItem = {
  id: string;
  name: string;
  displayName: string;
  order: number;
  isActive: boolean;
  _count: {
    students: number;
    sections: number;
    subjects: number;
  };
};

export type ClassDetail = ClassListItem & {
  sections: {
    id: string;
    name: string;
    capacity: number;
    isActive: boolean;
    _count: { students: number };
  }[];
};

// ─────────────────────────────────────────────────────────────
// Get All Classes
// ─────────────────────────────────────────────────────────────

export async function getClasses(): Promise<ClassListItem[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const schoolId = session.user.schoolId;

  let classIdFilter: string[] | undefined;

  if (role === "TEACHER" || role === "FACULTY") {
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id, schoolId, deletedAt: null },
      select: { id: true },
    });

    if (!teacher) return [];

    // Teacher ki assigned classes uske timetable entries se nikalo
    const timetableEntries = await db.timetable.findMany({
      where: { teacherId: teacher.id, schoolId, isActive: true },
      select: { classId: true },
      distinct: ["classId"],
    });

    classIdFilter = timetableEntries.map((t) => t.classId);

    if (classIdFilter.length === 0) return [];
  }

  const classes = await db.class.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(classIdFilter && { id: { in: classIdFilter } }),
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      displayName: true,
      order: true,
      isActive: true,
      _count: {
        select: {
          students: true,
          sections: { where: { deletedAt: null } },
          subjects: true,
        },
      },
    },
  });

  return classes;
}

// ─────────────────────────────────────────────────────────────
// Get Class by ID (with sections)
// ─────────────────────────────────────────────────────────────

export async function getClassById(
  id: string
): Promise<ActionResult<ClassDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const cls = await db.class.findFirst({
    where: { id, schoolId, deletedAt: null },
    select: {
      id: true,
      name: true,
      displayName: true,
      order: true,
      isActive: true,
      _count: {
        select: {
          students: true,
          sections: { where: { deletedAt: null } },
          subjects: true,
        },
      },
      sections: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          capacity: true,
          isActive: true,
          _count: { select: { students: true } },
        },
      },
    },
  });

  if (!cls) {
    return { success: false, error: "Class not found." };
  }

  return { success: true, data: cls as ClassDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Class
// ─────────────────────────────────────────────────────────────

export async function createClassAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = classSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.class.findFirst({
    where: { schoolId, name: parsed.data.name, deletedAt: null },
  });
  if (existing) {
    return {
      success: false,
      error: "A class with this name already exists.",
      fieldErrors: { name: ["This class name is already taken."] },
    };
  }

  const cls = await db.class.create({
    data: { schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/classes");
  return { success: true, data: { id: cls.id }, message: "Class created successfully." };
}

// ─────────────────────────────────────────────────────────────
// Update Class
// ─────────────────────────────────────────────────────────────

export async function updateClassAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = classUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  const cls = await db.class.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!cls) {
    return { success: false, error: "Class not found." };
  }

  await db.class.update({ where: { id }, data });

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${id}`);
  return { success: true, data: { id }, message: "Class updated successfully." };
}

// ─────────────────────────────────────────────────────────────
// Delete Class (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteClassAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const cls = await db.class.findFirst({
    where: { id, schoolId, deletedAt: null },
    select: { _count: { select: { students: true } } },
  });

  if (!cls) {
    return { success: false, error: "Class not found." };
  }

  if (cls._count.students > 0) {
    return {
      success: false,
      error: `Cannot delete — ${cls._count.students} student(s) are enrolled in this class.`,
    };
  }

  await db.class.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/dashboard/classes");
  return { success: true, data: null, message: "Class deleted successfully." };
}

// ─────────────────────────────────────────────────────────────
// Toggle Class Active Status
// ─────────────────────────────────────────────────────────────

export async function toggleClassStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  if (!session?.user) redirect("/login");

  await db.class.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/classes");
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────
// Create Section
// ─────────────────────────────────────────────────────────────

export async function createSectionAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = sectionSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { classId, name, capacity } = parsed.data;

  const existing = await db.section.findFirst({
    where: { classId, name, deletedAt: null },
  });
  if (existing) {
    return {
      success: false,
      error: "A section with this name already exists in this class.",
      fieldErrors: { name: ["This section name is already taken."] },
    };
  }

  const section = await db.section.create({
    data: { schoolId, classId, name, capacity },
  });

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${classId}`);
  return { success: true, data: { id: section.id }, message: "Section created successfully." };
}

// ─────────────────────────────────────────────────────────────
// Update Section
// ─────────────────────────────────────────────────────────────

export async function updateSectionAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = sectionUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  const section = await db.section.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
  });
  if (!section) {
    return { success: false, error: "Section not found." };
  }

  await db.section.update({ where: { id }, data });

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${section.classId}`);
  return { success: true, data: { id }, message: "Section updated successfully." };
}

// ─────────────────────────────────────────────────────────────
// Delete Section (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteSectionAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  if (!session?.user) redirect("/login");

  const section = await db.section.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      classId: true,
      _count: { select: { students: true } },
    },
  });

  if (!section) {
    return { success: false, error: "Section not found." };
  }

  if (section._count.students > 0) {
    return {
      success: false,
      error: `Cannot delete — ${section._count.students} student(s) are assigned to this section.`,
    };
  }

  await db.section.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${section.classId}`);
  return { success: true, data: null, message: "Section deleted successfully." };
}