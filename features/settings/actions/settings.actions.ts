"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hash } from "bcryptjs";
import type { ActionResult } from "@/types/globals.types";

// ─────────────────────────────────────────────────────────────
// Role guard helper
// ─────────────────────────────────────────────────────────────

const ADMIN_ONLY: string[] = ["SUPER_ADMIN", "PRINCIPAL"];
const SUPER_ADMIN_ONLY: string[] = ["SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────
// Get or Create School Settings (read — any authenticated staff can view)
// ─────────────────────────────────────────────────────────────

export async function getSchoolSettings() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  const schoolId = session.user.schoolId;

  let settings = await db.schoolSettings.findUnique({ where: { schoolId } });

  if (!settings) {
    settings = await db.schoolSettings.create({ data: { schoolId } });
  }

  const school = await db.school.findUnique({ where: { id: schoolId } });

  return { settings, school };
}

// ─────────────────────────────────────────────────────────────
// Update School Profile
// ─────────────────────────────────────────────────────────────

const schoolProfileSchema = z.object({
  name: z.string().min(1, "School name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  website: z.string().optional(),
});

export async function updateSchoolProfileAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = schoolProfileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.school.update({
    where: { id: session.user.schoolId },
    data: parsed.data,
  });

  revalidatePath("/dashboard/settings/school");
  return { success: true, data: null, message: "School profile updated." };
}

// ─────────────────────────────────────────────────────────────
// Update Academic Settings
// ─────────────────────────────────────────────────────────────

const academicSchema = z.object({
  currentSession: z.string().min(1, "Session is required"),
  sessionStartDate: z.string().min(1, "Start date required"),
  sessionEndDate: z.string().min(1, "End date required"),
  termsCount: z.coerce.number().int().min(1).max(4),
  timezone: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
});

export async function updateAcademicSettingsAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = academicSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const schoolId = session.user.schoolId;

  await db.schoolSettings.upsert({
    where: { schoolId },
    update: {
      currentSession: parsed.data.currentSession,
      sessionStartDate: new Date(parsed.data.sessionStartDate),
      sessionEndDate: new Date(parsed.data.sessionEndDate),
      termsCount: parsed.data.termsCount,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      dateFormat: parsed.data.dateFormat,
    },
    create: {
      schoolId,
      currentSession: parsed.data.currentSession,
      sessionStartDate: new Date(parsed.data.sessionStartDate),
      sessionEndDate: new Date(parsed.data.sessionEndDate),
      termsCount: parsed.data.termsCount,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      dateFormat: parsed.data.dateFormat,
    },
  });

  revalidatePath("/dashboard/settings/academic");
  return { success: true, data: null, message: "Academic settings updated." };
}

// ─────────────────────────────────────────────────────────────
// Terms Management
// ─────────────────────────────────────────────────────────────

const termSchema = z.object({
  name: z.string().min(1, "Term name required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  session: z.string().min(1),
  weightage: z.coerce.number().int().min(1).max(100),
});

export async function getTerms() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  return db.term.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { startDate: "asc" },
  });
}

export async function createTermAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = termSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const term = await db.term.create({
    data: {
      schoolId: session.user.schoolId,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      session: parsed.data.session,
      weightage: parsed.data.weightage,
    },
  });

  revalidatePath("/dashboard/settings/academic");
  return { success: true, data: { id: term.id }, message: "Term created." };
}

export async function deleteTermAction(id: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  await db.term.delete({
    where: { id, schoolId: session.user.schoolId },
  });

  revalidatePath("/dashboard/settings/academic");
  return { success: true, data: null, message: "Term deleted." };
}

// ─────────────────────────────────────────────────────────────
// Grading System
// ─────────────────────────────────────────────────────────────

export async function getGradeScales() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  return db.gradeScale.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { minMarks: "desc" },
  });
}

const gradeScaleSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  minMarks: z.coerce.number().int().min(0).max(100),
  maxMarks: z.coerce.number().int().min(0).max(100),
  gpa: z.coerce.number().min(0).max(4),
  remarks: z.string().optional(),
});

export async function createGradeScaleAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = gradeScaleSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const scale = await db.gradeScale.create({
    data: { schoolId: session.user.schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/settings/grading");
  return { success: true, data: { id: scale.id }, message: "Grade scale added." };
}

export async function deleteGradeScaleAction(id: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  await db.gradeScale.delete({
    where: { id, schoolId: session.user.schoolId },
  });

  revalidatePath("/dashboard/settings/grading");
  return { success: true, data: null, message: "Grade scale deleted." };
}

export async function seedDefaultGradeScales(): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const schoolId = session.user.schoolId;

  const existing = await db.gradeScale.count({ where: { schoolId } });
  if (existing > 0) {
    return { success: false, error: "Grade scales already exist." };
  }

  const defaultScales = [
    { grade: "A+", minMarks: 90, maxMarks: 100, gpa: 4.0, remarks: "Outstanding" },
    { grade: "A", minMarks: 80, maxMarks: 89, gpa: 4.0, remarks: "Excellent" },
    { grade: "A-", minMarks: 75, maxMarks: 79, gpa: 3.7, remarks: "Very Good" },
    { grade: "B+", minMarks: 70, maxMarks: 74, gpa: 3.3, remarks: "Good" },
    { grade: "B", minMarks: 65, maxMarks: 69, gpa: 3.0, remarks: "Satisfactory" },
    { grade: "B-", minMarks: 60, maxMarks: 64, gpa: 2.7, remarks: "Average" },
    { grade: "C+", minMarks: 55, maxMarks: 59, gpa: 2.3, remarks: "Below Average" },
    { grade: "C", minMarks: 50, maxMarks: 54, gpa: 2.0, remarks: "Pass" },
    { grade: "D", minMarks: 33, maxMarks: 49, gpa: 1.0, remarks: "Marginal Pass" },
    { grade: "F", minMarks: 0, maxMarks: 32, gpa: 0.0, remarks: "Fail" },
  ];

  await db.gradeScale.createMany({
    data: defaultScales.map((s) => ({ schoolId, ...s })),
  });

  revalidatePath("/dashboard/settings/grading");
  return { success: true, data: null, message: "Default grade scales loaded." };
}

// ─────────────────────────────────────────────────────────────
// User Management — SUPER_ADMIN ONLY
// ─────────────────────────────────────────────────────────────

export async function getUsers() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  return db.user.findMany({
    where: {
      schoolId: session.user.schoolId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      student: { select: { firstName: true, lastName: true } },
      teacher: { select: { firstName: true, lastName: true } },
      employee: { select: { firstName: true, lastName: true } },
      parent: { select: { firstName: true, lastName: true } },
    },
  });
}

const createUserSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum([
    "SUPER_ADMIN", "PRINCIPAL", "HR", "ACCOUNTANT",
    "TEACHER", "FACULTY", "STUDENT", "PARENT",
  ]),
});

export async function createUserAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return {
      success: false,
      error: "Email already in use.",
      fieldErrors: { email: ["This email is already registered."] },
    };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      schoolId: session.user.schoolId,
      email: parsed.data.email.toLowerCase(),
      password: hashedPassword,
      role: parsed.data.role,
    },
  });

  revalidatePath("/dashboard/settings/users");
  return { success: true, data: { id: user.id }, message: "User created." };
}

export async function toggleUserStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  if (id === session.user.id) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  await db.user.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/settings/users");
  return {
    success: true,
    data: null,
    message: `User ${isActive ? "activated" : "deactivated"}.`,
  };
}

export async function resetUserPasswordAction(
  id: string,
  newPassword: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const hashedPassword = await hash(newPassword, 12);

  await db.user.update({
    where: { id, schoolId: session.user.schoolId },
    data: { password: hashedPassword },
  });

  return { success: true, data: null, message: "Password reset successfully." };
}

// ─────────────────────────────────────────────────────────────
// Notification / SMS Settings
// ─────────────────────────────────────────────────────────────

const notificationSchema = z.object({
  smsApiKey: z.string().optional(),
  smsApiUrl: z.string().optional(),
  smsMasking: z.string().optional(),
  smsAbsentTemplate: z.string().optional(),
  smsFeeTemplate: z.string().optional(),
  smsResultTemplate: z.string().optional(),
});

export async function updateNotificationSettingsAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = notificationSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid data." };
  }

  const schoolId = session.user.schoolId;

  await db.schoolSettings.upsert({
    where: { schoolId },
    update: parsed.data,
    create: { schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/settings/notifications");
  return { success: true, data: null, message: "Notification settings updated." };
}

// ─────────────────────────────────────────────────────────────
// Fee Settings (Bank Details)
// ─────────────────────────────────────────────────────────────

const feeSettingsSchema = z.object({
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  passingMarks: z.coerce.number().int().min(1).max(100),
});

export async function updateFeeSettingsAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  const parsed = feeSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid data." };
  }

  const schoolId = session.user.schoolId;

  await db.schoolSettings.upsert({
    where: { schoolId },
    update: parsed.data,
    create: { schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/settings/fees");
  return { success: true, data: null, message: "Fee settings updated." };
}

// ─────────────────────────────────────────────────────────────
// Audit Logs — Super Admin only
// ─────────────────────────────────────────────────────────────

export async function getAuditLogs(params: {
  page?: number;
  search?: string;
  action?: string;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SUPER_ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  const schoolId = session.user.schoolId;
  const page = params.page ?? 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where = {
    schoolId,
    ...(params.search && {
      OR: [
        { action: { contains: params.search, mode: "insensitive" as const } },
        { entity: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
    ...(params.action && { action: params.action }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ipAddress: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            role: true,
            teacher: { select: { firstName: true, lastName: true } },
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─────────────────────────────────────────────────────────────
// Houses Management
// ─────────────────────────────────────────────────────────────

export async function getHouses() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) redirect("/login");

  return db.house.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { name: "asc" },
  });
}

const houseSchema = z.object({
  name: z.string().min(1, "House name required"),
  color: z.string().optional(),
});

export async function createHouseAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  const parsed = houseSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Please fix errors." };
  }

  const house = await db.house.create({
    data: { schoolId: session.user.schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/settings/academic");
  return { success: true, data: { id: house.id }, message: "House created." };
}

export async function deleteHouseAction(id: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ADMIN_ONLY.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to perform this action." };
  }

  await db.house.delete({
    where: { id, schoolId: session.user.schoolId },
  });

  revalidatePath("/dashboard/settings/academic");
  return { success: true, data: null, message: "House deleted." };
}