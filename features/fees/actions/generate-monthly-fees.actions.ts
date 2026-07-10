"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/globals.types";

const ALLOWED_ROLES = ["ACCOUNTANT", "PRINCIPAL", "SUPER_ADMIN"];

export async function generateMonthlyRecurringFees(): Promise<
  ActionResult<{ created: number; skipped: number; month: string }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to generate fees." };
  }

  const schoolId = session.user.schoolId;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const dueDate = new Date(year, month, 10); // 10th of current month
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  try {
    const [recurringFeeTypes, activeStudents] = await Promise.all([
      db.feeType.findMany({ where: { schoolId, isRecurring: true } }),
      db.student.findMany({
        where: { schoolId, isActive: true, deletedAt: null },
        select: { id: true },
      }),
    ]);

    if (recurringFeeTypes.length === 0) {
      return {
        success: false,
        error: "No recurring fee types found. Add one in Fee Types first.",
      };
    }

    if (activeStudents.length === 0) {
      return { success: false, error: "No active students found." };
    }

    // Find fees already generated this month for these fee types, to avoid duplicates
    const existingFees = await db.fee.findMany({
      where: {
        schoolId,
        feeTypeId: { in: recurringFeeTypes.map((ft) => ft.id) },
        dueDate: { gte: monthStart, lte: monthEnd },
      },
      select: { studentId: true, feeTypeId: true },
    });

    const existingKeys = new Set(existingFees.map((f) => `${f.studentId}:${f.feeTypeId}`));

    const feesToCreate: {
      schoolId: string;
      studentId: string;
      feeTypeId: string;
      amount: number;
      dueDate: Date;
    }[] = [];

    for (const student of activeStudents) {
      for (const feeType of recurringFeeTypes) {
        const key = `${student.id}:${feeType.id}`;
        if (!existingKeys.has(key)) {
          feesToCreate.push({
            schoolId,
            studentId: student.id,
            feeTypeId: feeType.id,
            amount: Number(feeType.amount),
            dueDate,
          });
        }
      }
    }

    if (feesToCreate.length > 0) {
      await db.fee.createMany({ data: feesToCreate });
    }

    const totalPossible = activeStudents.length * recurringFeeTypes.length;
    const skipped = totalPossible - feesToCreate.length;

    revalidatePath("/dashboard/fees");

    return {
      success: true,
      data: { created: feesToCreate.length, skipped, month: monthLabel },
      message:
        feesToCreate.length > 0
          ? `Generated ${feesToCreate.length} fee record(s) for ${monthLabel}. ${skipped} already existed.`
          : `All recurring fees for ${monthLabel} were already generated.`,
    };
  } catch (error) {
    console.error("generateMonthlyRecurringFees error:", error);
    return { success: false, error: "Failed to generate monthly fees. Please try again." };
  }
}