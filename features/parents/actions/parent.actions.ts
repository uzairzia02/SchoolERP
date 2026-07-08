"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ParentListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { students: number };
};

export type ParentDetail = ParentListItem & {
  students: {
    relation: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      admissionNumber: string;
      rollNumber: string | null;
      isActive: boolean;
      class: { id: string; name: string; displayName: string } | null;
      section: { id: string; name: string } | null;
      fees: {
        id: string;
        amount: number;
        paidAmount: number;
        status: string;
        dueDate: Date;
        feeType: { name: string };
      }[];
      attendance: { status: string }[];
    };
  }[];
};

// ─────────────────────────────────────────────────────────────
// Get Parents (paginated)
// ─────────────────────────────────────────────────────────────

export async function getParents(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}): Promise<PaginatedResponse<ParentListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.ParentWhereInput = {
    schoolId,
    deletedAt: null,
    ...(params.isActive !== undefined && { isActive: params.isActive }),
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    db.parent.findMany({
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
        occupation: true,
        isActive: true,
        createdAt: true,
        _count: { select: { students: true } },
      },
    }),
    db.parent.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

// ─────────────────────────────────────────────────────────────
// Get Parent by ID
// ─────────────────────────────────────────────────────────────

export async function getParentById(
  id: string
): Promise<ActionResult<ParentDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const parent = await db.parent.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      occupation: true,
      isActive: true,
      createdAt: true,
      _count: { select: { students: true } },
      students: {
        select: {
          relation: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              rollNumber: true,
              isActive: true,
              class: { select: { id: true, name: true, displayName: true } },
              section: { select: { id: true, name: true } },
              fees: {
                where: { status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
                take: 5,
                select: {
                  id: true,
                  amount: true,
                  paidAmount: true,
                  status: true,
                  dueDate: true,
                  feeType: { select: { name: true } },
                },
              },
              attendance: {
                where: {
                  date: { gte: firstDay, lte: today },
                  studentId: { not: null },
                },
                select: { status: true },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) return { success: false, error: "Parent not found." };

  return {
    success: true,
    data: {
      ...parent,
      students: parent.students.map((sp) => ({
        ...sp,
        student: {
          ...sp.student,
          fees: sp.student.fees.map((f) => ({
            ...f,
            amount: Number(f.amount),
            paidAmount: Number(f.paidAmount),
          })),
        },
      })),
    } as ParentDetail,
  };
}

// ─────────────────────────────────────────────────────────────
// Update Parent
// ─────────────────────────────────────────────────────────────

const updateParentSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().min(1, "Phone required"),
  occupation: z.string().optional(),
});

export async function updateParentAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = updateParentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  await db.parent.update({
    where: { id, schoolId: session.user.schoolId },
    data,
  });

  revalidatePath("/dashboard/parents");
  revalidatePath(`/dashboard/parents/${id}`);
  return { success: true, data: { id }, message: "Parent updated." };
}

// ─────────────────────────────────────────────────────────────
// Toggle Parent Status
// ─────────────────────────────────────────────────────────────

export async function toggleParentStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.parent.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/parents");
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────
// Reset Parent Password
// ─────────────────────────────────────────────────────────────

import { hash } from "bcryptjs";

export async function resetParentPasswordAction(
  parentId: string,
  newPassword: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const parent = await db.parent.findFirst({
    where: { id: parentId, schoolId: session.user.schoolId },
    select: { userId: true },
  });

  if (!parent) return { success: false, error: "Parent not found." };

  const hashedPassword = await hash(newPassword, 12);

  await db.user.update({
    where: { id: parent.userId },
    data: { password: hashedPassword },
  });

  return { success: true, data: null, message: "Password reset successfully." };
}

// ─────────────────────────────────────────────────────────────
// Get Parent Summary
// ─────────────────────────────────────────────────────────────

export async function getParentSummary() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const [total, active, withMultipleChildren] = await Promise.all([
    db.parent.count({ where: { schoolId, deletedAt: null } }),
    db.parent.count({ where: { schoolId, deletedAt: null, isActive: true } }),
    db.parent.count({
      where: {
        schoolId,
        deletedAt: null,
        students: { some: {} },
      },
    }),
  ]);

  return { total, active, inactive: total - active, withMultipleChildren };
}