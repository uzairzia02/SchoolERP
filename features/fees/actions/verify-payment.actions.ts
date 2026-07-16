"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { FeeStatus, NotificationType } from "@prisma/client";
import type { ActionResult } from "@/types/globals.types";

const REVIEWER_ROLES = ["ACCOUNTANT", "PRINCIPAL", "SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────
// Get pending submissions (for the verification queue)
// ─────────────────────────────────────────────────────────────

export async function getPendingPaymentSubmissions() {
  const session = await auth();
  if (!session?.user) return null;
  if (!REVIEWER_ROLES.includes(session.user.role)) return null;

  const submissions = await db.paymentSubmission.findMany({
    where: { schoolId: session.user.schoolId, status: "PENDING" },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNumber: true,
          class: { select: { displayName: true } },
        },
      },
      fee: { include: { feeType: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return submissions.map((s) => ({
    id: s.id,
    studentName: `${s.student.firstName} ${s.student.lastName}`,
    admissionNumber: s.student.admissionNumber,
    className: s.student.class?.displayName ?? "N/A",
    feeType: s.fee.feeType.name,
    amount: Number(s.amount),
    paymentMethod: s.paymentMethod,
    referenceNumber: s.referenceNumber,
    submittedAt: s.createdAt,
  }));
}

// ─────────────────────────────────────────────────────────────
// Approve — this is what actually marks the Fee as PAID
// ─────────────────────────────────────────────────────────────

export async function approvePaymentSubmission(
  submissionId: string
): Promise<ActionResult<{ transactionNumber: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!REVIEWER_ROLES.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to verify payments." };
  }

  const submission = await db.paymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      fee: { include: { feeType: { select: { name: true } } } },
      student: {
        include: {
          class: { select: { displayName: true } },
          parents: { include: { parent: { select: { userId: true } } } },
        },
      },
    },
  });

  if (!submission || submission.schoolId !== session.user.schoolId) {
    return { success: false, error: "Submission not found." };
  }
  if (submission.status !== "PENDING") {
    return { success: false, error: "This submission has already been reviewed." };
  }

  const transactionNumber = `TXN-${Date.now().toString(36).toUpperCase()}`;
  const paidAt = new Date();

  try {
    await db.$transaction(async (tx) => {
      await tx.fee.update({
        where: { id: submission.feeId },
        data: {
          paidAmount: { increment: Number(submission.amount) },
          status: FeeStatus.PAID,
          paidDate: paidAt,
          paymentMethod: submission.paymentMethod,
          receiptNumber: transactionNumber,
        },
      });

      await tx.paymentSubmission.update({
        where: { id: submissionId },
        data: {
          status: "APPROVED",
          transactionNumber,
          reviewedBy: session.user.id,
          reviewedAt: paidAt,
        },
      });

      // Notify the parent(s) linked to this student
      const parentUserIds = submission.student.parents
        .map((sp) => sp.parent.userId)
        .filter(Boolean);

      if (parentUserIds.length > 0) {
        await tx.notification.createMany({
          data: parentUserIds.map((userId) => ({
            schoolId: session.user.schoolId,
            userId,
            title: "Payment Verified",
            message: `Your payment of Rs. ${Number(submission.amount).toLocaleString()} for ${submission.fee.feeType.name} has been verified. Transaction #${transactionNumber}.`,
            type: NotificationType.SUCCESS,
            link: `/dashboard/parent/children/${submission.studentId}/fees`,
          })),
        });
      }
    });

    revalidatePath("/dashboard/fees/verify");
    revalidatePath("/dashboard/fees");
    revalidatePath(`/dashboard/parent/children/${submission.studentId}/fees`);

    return { success: true, data: { transactionNumber }, message: "Payment approved and recorded." };
  } catch (error) {
    console.error("approvePaymentSubmission error:", error);
    return { success: false, error: "Failed to approve payment. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────
// Reject
// ─────────────────────────────────────────────────────────────

export async function rejectPaymentSubmission(
  submissionId: string,
  reason: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!REVIEWER_ROLES.includes(session.user.role)) {
    return { success: false, error: "You don't have permission to verify payments." };
  }

  if (!reason?.trim()) {
    return { success: false, error: "Please provide a reason for rejection." };
  }

  const submission = await db.paymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      fee: { include: { feeType: { select: { name: true } } } },
      student: {
        include: { parents: { include: { parent: { select: { userId: true } } } } },
      },
    },
  });

  if (!submission || submission.schoolId !== session.user.schoolId) {
    return { success: false, error: "Submission not found." };
  }
  if (submission.status !== "PENDING") {
    return { success: false, error: "This submission has already been reviewed." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.paymentSubmission.update({
        where: { id: submissionId },
        data: {
          status: "REJECTED",
          rejectionReason: reason.trim(),
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      const parentUserIds = submission.student.parents
        .map((sp) => sp.parent.userId)
        .filter(Boolean);

      if (parentUserIds.length > 0) {
        await tx.notification.createMany({
          data: parentUserIds.map((userId) => ({
            schoolId: session.user.schoolId,
            userId,
            title: "Payment Rejected",
            message: `Your payment submission for ${submission.fee.feeType.name} could not be verified. Reason: ${reason.trim()}. Please resubmit with correct details.`,
            type: NotificationType.WARNING,
            link: `/dashboard/parent/children/${submission.studentId}/fees`,
          })),
        });
      }
    });

    revalidatePath("/dashboard/fees/verify");
    return { success: true, data: null, message: "Payment submission rejected." };
  } catch (error) {
    console.error("rejectPaymentSubmission error:", error);
    return { success: false, error: "Failed to reject payment. Please try again." };
  }
}