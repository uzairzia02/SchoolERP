"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  subjectSchema,
  subjectUpdateSchema,
} from "@/features/subjects/schemas/subject.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SubjectListItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  creditHours: number;
  isActive: boolean;
  class: { id: string; name: string; displayName: string } | null;
  _count: {
    teachers: number;
    grades: number;
  };
};

export type SubjectDetail = SubjectListItem & {
  teachers: {
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      employeeId: string;
    };
  }[];
};

// ─────────────────────────────────────────────────────────────
// Get Subjects (paginated + search)
// ─────────────────────────────────────────────────────────────

export async function getSubjects(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  classId?: string;
}): Promise<PaginatedResponse<SubjectListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.SubjectWhereInput = {
    schoolId,
    deletedAt: null,
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { code: { contains: params.search, mode: "insensitive" } },
      ],
    }),
    ...(params.classId && { classId: params.classId }),
  };

  const [data, total] = await Promise.all([
    db.subject.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        creditHours: true,
        isActive: true,
        class: { select: { id: true, name: true, displayName: true } },
        _count: { select: { teachers: true, grades: true } },
      },
    }),
    db.subject.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

// ─────────────────────────────────────────────────────────────
// Get Subject by ID
// ─────────────────────────────────────────────────────────────

export async function getSubjectById(
  id: string
): Promise<ActionResult<SubjectDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const subject = await db.subject.findFirst({
    where: { id, schoolId, deletedAt: null },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      creditHours: true,
      isActive: true,
      class: { select: { id: true, name: true, displayName: true } },
      _count: { select: { teachers: true, grades: true } },
      teachers: {
        select: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
        },
      },
    },
  });

  if (!subject) {
    return { success: false, error: "Subject not found." };
  }

  return { success: true, data: subject as SubjectDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Subject
// ─────────────────────────────────────────────────────────────

export async function createSubjectAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = subjectSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.subject.findFirst({
    where: { schoolId, code: parsed.data.code, deletedAt: null },
  });
  if (existing) {
    return {
      success: false,
      error: "A subject with this code already exists.",
      fieldErrors: { code: ["This subject code is already taken."] },
    };
  }

  const subject = await db.subject.create({
    data: {
      schoolId,
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      creditHours: parsed.data.creditHours,
      classId: parsed.data.classId || null,
    },
  });

  revalidatePath("/dashboard/subjects");
  return {
    success: true,
    data: { id: subject.id },
    message: "Subject created successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Update Subject
// ─────────────────────────────────────────────────────────────

export async function updateSubjectAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = subjectUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  const subject = await db.subject.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!subject) {
    return { success: false, error: "Subject not found." };
  }

  // Check code conflict on update
  if (data.code && data.code !== subject.code) {
    const codeExists = await db.subject.findFirst({
      where: { schoolId, code: data.code, deletedAt: null, NOT: { id } },
    });
    if (codeExists) {
      return {
        success: false,
        error: "Subject code already in use.",
        fieldErrors: { code: ["This code is already taken."] },
      };
    }
  }

  await db.subject.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      creditHours: data.creditHours,
      classId: data.classId || null,
    },
  });

  revalidatePath("/dashboard/subjects");
  revalidatePath(`/dashboard/subjects/${id}`);
  return {
    success: true,
    data: { id },
    message: "Subject updated successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Delete Subject (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteSubjectAction(
  id: string
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const subject = await db.subject.findFirst({
    where: { id, schoolId, deletedAt: null },
    select: { _count: { select: { teachers: true, grades: true } } },
  });

  if (!subject) {
    return { success: false, error: "Subject not found." };
  }

  if (subject._count.grades > 0) {
    return {
      success: false,
      error: `Cannot delete — this subject has ${subject._count.grades} grade record(s).`,
    };
  }

  await db.subject.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/dashboard/subjects");
  return {
    success: true,
    data: null,
    message: "Subject deleted successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Toggle Subject Status
// ─────────────────────────────────────────────────────────────

export async function toggleSubjectStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.subject.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/subjects");
  return { success: true, data: null };
}