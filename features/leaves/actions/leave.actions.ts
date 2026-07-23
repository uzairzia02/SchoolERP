"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types/globals.types";

const leaveSchema = z.object({
  type: z.enum(["CASUAL", "SICK", "ANNUAL", "MATERNITY", "PATERNITY", "UNPAID"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
});

export type MyLeaveItem = {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: string;
  remarks: string | null;
  createdAt: Date;
};

// ─────────────────────────────────────────────────────────────
// Get My Leaves (Teacher or Employee, based on logged-in role)
// ─────────────────────────────────────────────────────────────

export async function getMyLeaves(): Promise<MyLeaveItem[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const role = session.user.role;

  let where: { schoolId: string; teacherId?: string; employeeId?: string } = { schoolId };

  if (role === "TEACHER" || role === "FACULTY") {
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!teacher) return [];
    where = { schoolId, teacherId: teacher.id };
  } else {
    const employee = await db.employee.findFirst({
      where: { userId: session.user.id, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) return [];
    where = { schoolId, employeeId: employee.id };
  }

  const leaves = await db.leave.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      totalDays: true,
      reason: true,
      status: true,
      remarks: true,
      createdAt: true,
    },
  });

  return leaves;
}

// ─────────────────────────────────────────────────────────────
// Apply for Leave
// ─────────────────────────────────────────────────────────────

export async function applyLeaveAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const role = session.user.role;

  const parsed = leaveSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate < startDate) {
    return { success: false, error: "End date must be after start date." };
  }

  const totalDays =
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let teacherId: string | undefined;
  let employeeId: string | undefined;

  if (role === "TEACHER" || role === "FACULTY") {
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!teacher) return { success: false, error: "Teacher profile not found." };
    teacherId = teacher.id;
  } else {
    const employee = await db.employee.findFirst({
      where: { userId: session.user.id, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) return { success: false, error: "Employee profile not found." };
    employeeId = employee.id;
  }

  const leave = await db.leave.create({
    data: {
      schoolId,
      teacherId,
      employeeId,
      type: data.type,
      startDate,
      endDate,
      totalDays,
      reason: data.reason,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/leaves");
  return {
    success: true,
    data: { id: leave.id },
    message: "Leave application submitted.",
  };
}

// ─────────────────────────────────────────────────────────────
// Approve Leave (HR, SUPER_ADMIN, ADMIN only)
// ─────────────────────────────────────────────────────────────

export async function approveLeave(leaveId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Sirf HR, SUPER_ADMIN, ADMIN approve kar sakte hain
  if (!["HR", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized: Only HR or Admin can approve leaves");
  }

  await db.leave.update({
    where: { id: leaveId },
    data: {
      status: "APPROVED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/leaves");
  revalidatePath("/dashboard/hr");
  revalidatePath("/dashboard/super-admin");
  revalidatePath("/dashboard/admin");
}

// ─────────────────────────────────────────────────────────────
// Reject Leave (HR, SUPER_ADMIN, ADMIN only)
// ─────────────────────────────────────────────────────────────

export async function rejectLeave(leaveId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Sirf HR, SUPER_ADMIN, ADMIN reject kar sakte hain
  if (!["HR", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized: Only HR or Admin can reject leaves");
  }

  await db.leave.update({
    where: { id: leaveId },
    data: {
      status: "REJECTED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/leaves");
  revalidatePath("/dashboard/hr");
  revalidatePath("/dashboard/super-admin");
  revalidatePath("/dashboard/admin");
}