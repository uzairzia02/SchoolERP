"use server";

import { signIn, signOut } from "@/lib/auth";
import { LogoutButton } from "@/components/ui/logout-button";
import { loginSchema } from "@/lib/validations/auth.schema";
import { ROLE_DASHBOARD_ROUTES } from "@/constants/routes";
import { MESSAGES } from "@/constants/messages";
import type { ActionResult } from "@/types/globals.types";
import type { UserRole } from "@prisma/client";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

// ─────────────────────────────────────────────────────────────
// Login Action
// ─────────────────────────────────────────────────────────────

export async function loginAction(
  values: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  // 1. Validate input
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: MESSAGES.common.validationError,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = parsed.data;

  try {
    // 2. Attempt sign in
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // 3. Fetch user role for redirect
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { role: true },
    });

    const redirectTo =
      ROLE_DASHBOARD_ROUTES[user?.role as UserRole] ?? "/dashboard";

    return { success: true, data: { redirectTo } };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: MESSAGES.auth.invalidCredentials,
          };
        default:
          return {
            success: false,
            error: MESSAGES.common.error,
          };
      }
    }

    return {
      success: false,
      error: MESSAGES.common.serverError,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Logout Action
// ─────────────────────────────────────────────────────────────

export async function logoutAction() {
  console.log("LOGOUT START");
  await signOut({ redirectTo: "/login" });
}

// ─────────────────────────────────────────────────────────────
// Seed Super Admin (run once during setup)
// ─────────────────────────────────────────────────────────────

export async function seedSuperAdminAction(values: {
  schoolName: string;
  schoolCode: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolCity: string;
  schoolState: string;
  schoolCountry: string;
  schoolZipCode: string;
  adminEmail: string;
  adminPassword: string;
}): Promise<ActionResult<{ schoolId: string; userId: string }>> {
  try {
    // Check if any school already exists
    const existingSchool = await db.school.findFirst();
    if (existingSchool) {
      return {
        success: false,
        error: "Setup has already been completed.",
      };
    }

    const hashedPassword = await hash(values.adminPassword, 12);

    // Create school + super admin in a transaction
    const result = await db.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: values.schoolName,
          code: values.schoolCode.toUpperCase(),
          email: values.schoolEmail,
          phone: values.schoolPhone,
          address: values.schoolAddress,
          city: values.schoolCity,
          state: values.schoolState,
          country: values.schoolCountry,
          zipCode: values.schoolZipCode,
        },
      });

      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          email: values.adminEmail.toLowerCase(),
          password: hashedPassword,
          role: "SUPER_ADMIN",
        },
      });

      return { school, user };
    });

    return {
      success: true,
      data: {
        schoolId: result.school.id,
        userId: result.user.id,
      },
      message: "School and Super Admin created successfully.",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to complete setup. Please try again.",
    };
  }
}