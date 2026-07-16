// "use server";

// import { auth } from "@/lib/auth";
// import { db } from "@/lib/db";
// import { revalidatePath } from "next/cache";
// import { PaymentMethod, FeeStatus, UserRole, NotificationType } from "@prisma/client";
// import type { ActionResult } from "@/types/globals.types";

// interface PayFeeInput {
//   feeId: string;
//   studentId: string;
//   paymentMethod: "BANK_TRANSFER" | "ONLINE";
// }

// export async function submitFeePayment(
//   input: PayFeeInput
// ): Promise<
//   ActionResult<{
//     transactionNumber: string;
//     studentName: string;
//     className: string;
//     sectionName: string;
//     schoolName: string;
//     feeType: string;
//     amount: number;
//     paidAt: Date;
//     paymentMethod: string;
//   }>
// > {
//   const session = await auth();
//   if (!session?.user || session.user.role !== "PARENT") {
//     return { success: false, error: "Unauthorized" };
//   }

//   const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
//   if (!parent) return { success: false, error: "Parent profile not found." };

//   const link = await db.studentParent.findFirst({
//     where: { parentId: parent.id, studentId: input.studentId },
//     include: {
//       student: {
//         include: {
//           class: { select: { displayName: true } },
//           section: { select: { name: true } },
//         },
//       },
//     },
//   });
//   if (!link) return { success: false, error: "This student is not linked to your account." };

//   const fee = await db.fee.findUnique({
//     where: { id: input.feeId },
//     include: { feeType: { select: { name: true } } },
//   });

//   if (!fee || fee.studentId !== input.studentId) {
//     return { success: false, error: "Fee record not found." };
//   }
//   if (fee.status === FeeStatus.PAID) {
//     return { success: false, error: "This fee has already been paid." };
//   }

//   const school = await db.school.findUnique({ where: { id: session.user.schoolId } });
//   if (!school) return { success: false, error: "School not found." };

//   const remainingDue =
//     Number(fee.amount) + Number(fee.fine) - Number(fee.discount) - Number(fee.paidAmount);

//   // System-generated unique transaction number — this is what parent,
//   // accountant, and super admin all use to track this payment.
//   const transactionNumber = `TXN-${Date.now().toString(36).toUpperCase()}`;
//   const paidAt = new Date();
//   const method =
//     input.paymentMethod === "ONLINE" ? PaymentMethod.ONLINE : PaymentMethod.BANK_TRANSFER;

//   const studentName = `${link.student.firstName} ${link.student.lastName}`;
//   const className = link.student.class?.displayName ?? "N/A";
//   const sectionName = link.student.section?.name ?? "N/A";

//   try {
//     await db.$transaction(async (tx) => {
//       await tx.fee.update({
//         where: { id: fee.id },
//         data: {
//           paidAmount: Number(fee.paidAmount) + remainingDue,
//           status: FeeStatus.PAID,
//           paidDate: paidAt,
//           paymentMethod: method,
//           receiptNumber: transactionNumber,
//         },
//       });

//       const staffToNotify = await tx.user.findMany({
//         where: {
//           schoolId: session.user.schoolId,
//           role: { in: [UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.SUPER_ADMIN] },
//         },
//         select: { id: true },
//       });

//       if (staffToNotify.length > 0) {
//         const timeStr = paidAt.toLocaleString("en-US", {
//           dateStyle: "medium",
//           timeStyle: "short",
//         });

//         await tx.notification.createMany({
//           data: staffToNotify.map((u) => ({
//             schoolId: session.user.schoolId,
//             userId: u.id,
//             title: "Fee Payment Received",
//             message: `Transaction #${transactionNumber} — ${studentName} (${className} - ${sectionName}) paid ${fee.feeType.name}: Rs. ${remainingDue.toLocaleString()} via ${method.replace("_", " ")} on ${timeStr}. School: ${school.name}.`,
//             type: NotificationType.SUCCESS,
//             link: "/dashboard/fees",
//           })),
//         });
//       }
//     });

//     revalidatePath("/dashboard/parent");
//     revalidatePath(`/dashboard/parent/children/${input.studentId}/fees`);
//     revalidatePath("/dashboard/fees");

//     return {
//       success: true,
//       data: {
//         transactionNumber,
//         studentName,
//         className,
//         sectionName,
//         schoolName: school.name,
//         feeType: fee.feeType.name,
//         amount: remainingDue,
//         paidAt,
//         paymentMethod: method,
//       },
//       message: "Payment recorded successfully.",
//     };
//   } catch (error) {
//     console.error("submitFeePayment error:", error);
//     return { success: false, error: "Failed to record payment. Please try again." };
//   }
// }