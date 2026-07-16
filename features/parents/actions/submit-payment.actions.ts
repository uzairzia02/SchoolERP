"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod, FeeStatus, UserRole, NotificationType } from "@prisma/client";
import type { ActionResult } from "@/types/globals.types";

interface SubmitPaymentInput {
  feeId: string;
  studentId: string;
  referenceNumber: string;
  paymentMethod: "BANK_TRANSFER" | "ONLINE";
}

export async function submitPaymentForVerification(
  input: SubmitPaymentInput
): Promise<ActionResult<{ submissionId: string }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    return { success: false, error: "Unauthorized" };
  }

  if (!input.referenceNumber?.trim()) {
    return { success: false, error: "Please enter your bank transaction/reference number." };
  }

  const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return { success: false, error: "Parent profile not found." };

  const link = await db.studentParent.findFirst({
    where: { parentId: parent.id, studentId: input.studentId },
    include: { student: { include: { class: { select: { displayName: true } } } } },
  });
  if (!link) return { success: false, error: "This student is not linked to your account." };

  const fee = await db.fee.findUnique({
    where: { id: input.feeId },
    include: { feeType: { select: { name: true } } },
  });
  if (!fee || fee.studentId !== input.studentId) {
    return { success: false, error: "Fee record not found." };
  }
  if (fee.status === FeeStatus.PAID) {
    return { success: false, error: "This fee has already been paid." };
  }

  // Prevent duplicate pending submissions for the same fee
  const existingPending = await db.paymentSubmission.findFirst({
    where: { feeId: fee.id, status: "PENDING" },
  });
  if (existingPending) {
    return {
      success: false,
      error: "A payment for this fee is already pending verification.",
    };
  }

  const remainingDue =
    Number(fee.amount) + Number(fee.fine) - Number(fee.discount) - Number(fee.paidAmount);

  const method =
    input.paymentMethod === "ONLINE" ? PaymentMethod.ONLINE : PaymentMethod.BANK_TRANSFER;

  try {
    const submission = await db.$transaction(async (tx) => {
      const created = await tx.paymentSubmission.create({
        data: {
          schoolId: session.user.schoolId,
          feeId: fee.id,
          studentId: input.studentId,
          submittedBy: session.user.id,
          paymentMethod: method,
          referenceNumber: input.referenceNumber.trim(),
          amount: remainingDue,
        },
      });

      const staffToNotify = await tx.user.findMany({
        where: {
          schoolId: session.user.schoolId,
          role: { in: [UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.SUPER_ADMIN] },
        },
        select: { id: true },
      });

      if (staffToNotify.length > 0) {
        await tx.notification.createMany({
          data: staffToNotify.map((u) => ({
            schoolId: session.user.schoolId,
            userId: u.id,
            title: "New Payment Awaiting Verification",
            message: `${link.student.firstName} ${link.student.lastName} (${link.student.class?.displayName ?? "N/A"}) submitted a payment of Rs. ${remainingDue.toLocaleString()} for ${fee.feeType.name}. Reference: ${input.referenceNumber.trim()}.`,
            type: NotificationType.INFO,
            link: "/dashboard/fees/verify",
          })),
        });
      }

      return created;
    });

    revalidatePath(`/dashboard/parent/children/${input.studentId}/fees`);
    revalidatePath("/dashboard/fees/verify");

    return {
      success: true,
      data: { submissionId: submission.id },
      message: "Payment submitted for verification. You'll be notified once it's confirmed.",
    };
  } catch (error) {
    console.error("submitPaymentForVerification error:", error);
    return { success: false, error: "Failed to submit payment. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────
// Get submission status for a fee (so parent can see Pending/Approved/Rejected)
// ─────────────────────────────────────────────────────────────

export async function getFeePaymentSubmissions(feeId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") return [];

  return db.paymentSubmission.findMany({
    where: { feeId },
    orderBy: { createdAt: "desc" },
  });
}