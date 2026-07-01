"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  teacherSchema,
  teacherUpdateSchema,
} from "@/features/teachers/schemas/teacher.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { teacherStatusSchema } from "@/features/teachers/schemas/teacher.schema";


// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type TeacherListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  isActive: boolean;
  joiningDate: Date;
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
  lastWorkingDate: Date | null;
  leavingReason: string | null;
};

export type TeacherDetail = TeacherListItem & {
  gender: string;
  dateOfBirth: Date | null;
  address: string | null;
  qualification: string | null;
  experience: number | null;
  subjects: { subject: { id: string; name: string; code: string } }[];
};

// ─────────────────────────────────────────────────────────────
// Get Teachers (paginated + search)
// ─────────────────────────────────────────────────────────────

export async function getTeachers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
}): Promise<PaginatedResponse<TeacherListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.TeacherWhereInput = {
    schoolId,
    deletedAt: null,
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { employeeId: { contains: params.search, mode: "insensitive" } },
      ],
    }),
    ...(params.departmentId && { departmentId: params.departmentId }),
  };

  const [data, total] = await Promise.all([
    db.teacher.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        employeeId: true,
        lastWorkingDate: true,
        leavingReason: true,
        isActive: true,
        joiningDate: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    }),
    db.teacher.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

// ─────────────────────────────────────────────────────────────
// Get Teacher by ID
// ─────────────────────────────────────────────────────────────

export async function getTeacherById(
  id: string
): Promise<ActionResult<TeacherDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const teacher = await db.teacher.findFirst({
    where: { id, schoolId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      employeeId: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      qualification: true,
      lastWorkingDate: true,
      leavingReason: true,
      experience: true,
      isActive: true,
      joiningDate: true,
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
      subjects: {
        select: {
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!teacher) {
    return { success: false, error: "Teacher not found." };
  }

  return { success: true, data: teacher as TeacherDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Teacher
// ─────────────────────────────────────────────────────────────

export async function createTeacherAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = teacherSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const existingEmployeeId = await db.teacher.findFirst({
    where: { schoolId, employeeId: data.employeeId, deletedAt: null },
  });
  if (existingEmployeeId) {
    return {
      success: false,
      error: "Employee ID already exists.",
      fieldErrors: { employeeId: ["This employee ID is already taken."] },
    };
  }

  const existingEmail = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existingEmail) {
    return {
      success: false,
      error: "Email already in use.",
      fieldErrors: { email: ["This email is already registered."] },
    };
  }

  const hashedPassword = await hash("Teacher@123", 12);

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          role: "TEACHER",
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          schoolId,
          userId: user.id,
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: data.address ?? null,
          departmentId: data.departmentId || null,
          designationId: data.designationId || null,
          qualification: data.qualification ?? null,
          experience: data.experience ?? null,
          joiningDate: new Date(data.joiningDate),
          createdBy: session.user.id,
        },
      });

      if (data.subjectIds && data.subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: data.subjectIds.map((subjectId) => ({
            teacherId: teacher.id,
            subjectId,
          })),
        });
      }

      return teacher;
    });

    revalidatePath("/dashboard/teachers");
    return { success: true, data: { id: result.id }, message: "Teacher created successfully." };
  } catch (error) {
    console.error("Create teacher error:", error);
    return { success: false, error: "Failed to create teacher. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Teacher
// ─────────────────────────────────────────────────────────────

export async function updateTeacherAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = teacherUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, subjectIds, ...data } = parsed.data;

  const teacher = await db.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!teacher) {
    return { success: false, error: "Teacher not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.teacher.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        address: data.address ?? null,
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        qualification: data.qualification ?? null,
        experience: data.experience ?? null,
        updatedBy: session.user.id,
      },
    });

    if (subjectIds) {
      await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
      if (subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjectIds.map((subjectId) => ({ teacherId: id, subjectId })),
        });
      }
    }
  });

  revalidatePath("/dashboard/teachers");
  revalidatePath(`/dashboard/teachers/${id}`);
  return { success: true, data: { id }, message: "Teacher updated successfully." };
}

// ─────────────────────────────────────────────────────────────
// Delete Teacher (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteTeacherAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const teacher = await db.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!teacher) {
    return { success: false, error: "Teacher not found." };
  }

  await db.teacher.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, updatedBy: session.user.id },
  });

  revalidatePath("/dashboard/teachers");
  return { success: true, data: null, message: "Teacher deleted successfully." };
}

// ─────────────────────────────────────────────────────────────
// Dropdowns
// ─────────────────────────────────────────────────────────────

export async function getDepartmentsForSelect() {
  const session = await auth();
  if (!session?.user) return [];

  return db.department.findMany({
    where: { schoolId: session.user.schoolId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getDesignationsForSelect(departmentId: string) {
  const session = await auth();
  if (!session?.user) return [];

  return db.designation.findMany({
    where: {
      departmentId,
      schoolId: session.user.schoolId,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getSubjectsForSelect() {
  const session = await auth();
  if (!session?.user) return [];

  return db.subject.findMany({
    where: { schoolId: session.user.schoolId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });
}

// ─────────────────────────────────────────────────────────────
// Update Teacher Status (Active / Inactive with offboarding info)
// ─────────────────────────────────────────────────────────────

export async function updateTeacherStatusAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = teacherStatusSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, isActive, lastWorkingDate, leavingReason } = parsed.data;

  const teacher = await db.teacher.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!teacher) {
    return { success: false, error: "Teacher not found." };
  }

  // Agar inactive kar rahe hain to last working date required hai
  if (!isActive && !lastWorkingDate) {
    return {
      success: false,
      error: "Last working date is required when marking a teacher inactive.",
      fieldErrors: { lastWorkingDate: ["This field is required."] },
    };
  }

  await db.teacher.update({
    where: { id },
    data: {
      isActive,
      lastWorkingDate: isActive ? null : lastWorkingDate ? new Date(lastWorkingDate) : null,
      leavingReason: isActive ? null : leavingReason || null,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/teachers");
  revalidatePath(`/dashboard/teachers/${id}`);

  return {
    success: true,
    data: { id },
    message: isActive
      ? "Teacher marked as active."
      : "Teacher marked as inactive.",
  };
}