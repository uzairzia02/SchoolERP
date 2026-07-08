"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import type { ActionResult } from "@/types/globals.types";
import type { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ProfileData = {
  userId: string;
  email: string;
  role: UserRole;
  schoolName: string;
  lastLoginAt: Date | null;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    employeeId?: string;
    admissionNumber?: string;
    gender?: string;
    dateOfBirth?: Date | null;
    address?: string | null;
    department?: { name: string } | null;
    designation?: { name: string } | null;
    qualification?: string | null;
    experience?: number | null;
    joiningDate?: Date;
    admissionDate?: Date;
    class?: { displayName: string } | null;
    section?: { name: string } | null;
    rollNumber?: string | null;
    isActive: boolean;
  } | null;
};

// ─────────────────────────────────────────────────────────────
// Get Profile
// ─────────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<ActionResult<ProfileData>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      lastLoginAt: true,
      school: { select: { name: true } },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          employeeId: true,
          gender: true,
          dateOfBirth: true,
          address: true,
          qualification: true,
          experience: true,
          joiningDate: true,
          isActive: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          employeeId: true,
          gender: true,
          dateOfBirth: true,
          address: true,
          joiningDate: true,
          isActive: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          admissionNumber: true,
          gender: true,
          dateOfBirth: true,
          address: true,
          rollNumber: true,
          admissionDate: true,
          isActive: true,
          class: { select: { displayName: true } },
          section: { select: { name: true } },
        },
      },
      parent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) return { success: false, error: "User not found." };

  const profile = user.teacher ?? user.employee ?? user.student ?? user.parent;

  return {
    success: true,
    data: {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolName: user.school.name,
      lastLoginAt: user.lastLoginAt,
      profile: profile
        ? {
            ...profile,
            gender: "gender" in profile ? profile.gender : undefined,
            dateOfBirth: "dateOfBirth" in profile ? profile.dateOfBirth : undefined,
            address: "address" in profile ? profile.address : undefined,
            employeeId: "employeeId" in profile ? profile.employeeId : undefined,
            admissionNumber: "admissionNumber" in profile ? profile.admissionNumber : undefined,
            department: "department" in profile ? profile.department : undefined,
            designation: "designation" in profile ? profile.designation : undefined,
            qualification: "qualification" in profile ? (profile as any).qualification : undefined,
            experience: "experience" in profile ? (profile as any).experience : undefined,
            joiningDate: "joiningDate" in profile ? (profile as any).joiningDate : undefined,
            admissionDate: "admissionDate" in profile ? (profile as any).admissionDate : undefined,
            class: "class" in profile ? (profile as any).class : undefined,
            section: "section" in profile ? (profile as any).section : undefined,
            rollNumber: "rollNumber" in profile ? (profile as any).rollNumber : undefined,
          }
        : null,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Change Password
// ─────────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must have uppercase letter")
    .regex(/[0-9]/, "Must have a number"),
  confirmPassword: z.string().min(1, "Confirm password required"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function changePasswordAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user) return { success: false, error: "User not found." };

  const isValid = await compare(parsed.data.currentPassword, user.password);
  if (!isValid) {
    return {
      success: false,
      error: "Current password is incorrect.",
      fieldErrors: { currentPassword: ["Incorrect password."] },
    };
  }

  const hashedPassword = await hash(parsed.data.newPassword, 12);

  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return { success: true, data: null, message: "Password changed successfully." };
}

// ─────────────────────────────────────────────────────────────
// Update Profile (phone, address)
// ─────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function updateProfileAction(
  values: unknown
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid data." };
  }

  const userId = session.user.id;
  const role = session.user.role as UserRole;

  if (role === "TEACHER" || role === "FACULTY") {
    await db.teacher.updateMany({
      where: { userId },
      data: {
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
    });
  } else if (role === "HR" || role === "ACCOUNTANT" || role === "SUPER_ADMIN" || role === "PRINCIPAL") {
    await db.employee.updateMany({
      where: { userId },
      data: {
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
    });
  } else if (role === "STUDENT") {
    await db.student.updateMany({
      where: { userId },
      data: {
        phone: parsed.data.phone,
        address: parsed.data.address,
      },
    });
  } else if (role === "PARENT") {
    await db.parent.updateMany({
      where: { userId },
      data: { phone: parsed.data.phone },
    });
  }

  revalidatePath("/dashboard/profile");
  return { success: true, data: null, message: "Profile updated." };
}