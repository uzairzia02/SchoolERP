"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { requireRoles } from "@/lib/auth-guards";
import {
  admissionSchema,
  enrollStudentSchema,
  updateAdmissionStatusSchema,
} from "@/features/admissions/schemas/admission.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { AdmissionStatus, Prisma, UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AdmissionListItem = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  applyingForClass: string;
  status: AdmissionStatus;
  appliedAt: Date;
  phone: string | null;
  email: string | null;
  remarks: string | null;
};

export type AdmissionDetail = AdmissionListItem & {
  religion: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  previousSchool: string | null;
  previousClass: string | null;
  previousGrade: string | null;
  reviewedBy: string | null;
  documents: string[];
};

// ─────────────────────────────────────────────────────────────
// Generate Roll Number
// ─────────────────────────────────────────────────────────────

async function generateRollNumber(
  schoolId: string,
  classId: string,
  sectionId?: string
): Promise<string> {
  // Get highest roll number in this class/section
  const lastStudent = await db.student.findFirst({
    where: {
      schoolId,
      classId,
      ...(sectionId && { sectionId }),
      deletedAt: null,
      rollNumber: { not: null },
    },
    orderBy: { rollNumber: "desc" },
    select: { rollNumber: true },
  });

  if (!lastStudent?.rollNumber) return "01";

  const lastNumber = parseInt(lastStudent.rollNumber, 10);
  if (isNaN(lastNumber)) return "01";

  return String(lastNumber + 1).padStart(2, "0");
}

// ─────────────────────────────────────────────────────────────
// Generate Admission Number
// ─────────────────────────────────────────────────────────────

async function generateAdmissionNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();

  const lastStudent = await db.student.findFirst({
    where: {
      schoolId,
      admissionNumber: { startsWith: `${year}-` },
      deletedAt: null,
    },
    orderBy: { admissionNumber: "desc" },
    select: { admissionNumber: true },
  });

  if (!lastStudent?.admissionNumber) return `${year}-0001`;

  const parts = lastStudent.admissionNumber.split("-");
  const lastNum = parseInt(parts[parts.length - 1], 10);
  if (isNaN(lastNum)) return `${year}-0001`;

  return `${year}-${String(lastNum + 1).padStart(4, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Get Admissions
// ─────────────────────────────────────────────────────────────

export async function getAdmissions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AdmissionStatus;
}): Promise<PaginatedResponse<AdmissionListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.AdmissionWhereInput = {
    schoolId,
    ...(params.status && { status: params.status }),
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
    db.admission.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        applyingForClass: true,
        status: true,
        appliedAt: true,
        phone: true,
        email: true,
        remarks: true,
      },
    }),
    db.admission.count({ where }),
  ]);

  return buildPaginatedResponse(
    data as AdmissionListItem[],
    total,
    page,
    pageSize
  );
}

// ─────────────────────────────────────────────────────────────
// Get Admission by ID
// ─────────────────────────────────────────────────────────────

export async function getAdmissionById(
  id: string
): Promise<ActionResult<AdmissionDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const admission = await db.admission.findFirst({
    where: { id, schoolId: session.user.schoolId },
  });

  if (!admission) {
    return { success: false, error: "Admission not found." };
  }

  // 1. Array ke andar se target JSON string ko find aur parse karein
  let previousSchoolInfo: any = {};

  if (admission.documents && Array.isArray(admission.documents)) {
    const previousSchoolStr = admission.documents.find((docStr) => {
      try {
        return JSON.parse(docStr as string).type === "previous_school";
      } catch {
        return false;
      }
    });

    if (previousSchoolStr) {
      try {
        previousSchoolInfo = JSON.parse(previousSchoolStr as string);
      } catch (e) {
        console.error("Failed to parse previous school JSON", e);
      }
    }
  }

  // 2. Sirf wahi missing fields merge karein jo AdmissionDetail type demand kar raha hai
  const admissionDetail: AdmissionDetail = {
    ...admission,
    previousSchool: previousSchoolInfo.previousSchool || null,
    previousClass: previousSchoolInfo.previousClass || null,
    previousGrade: previousSchoolInfo.previousGrade || null,
    documents: admission.documents as string[],
  };

  return { success: true, data: admissionDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Admission Application
// ─────────────────────────────────────────────────────────────

export async function createAdmissionAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Air-tight Role Guard: Sirf management teams hi admission form execute kar sakti hain
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);

  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  // 2. Data Validation Check
  const parsed = admissionSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // 3. Database Insertion
  const admission = await db.admission.create({
    data: {
      schoolId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      email: data.email || null,
      phone: data.phone || null,
      religion: data.religion || null,
      nationality: data.nationality || null,
      applyingForClass: data.applyingForClass,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
      remarks: data.remarks || null,
      status: "APPLIED",
      // Store parent + previous school info in documents array as JSON strings
      documents: [
        JSON.stringify({
          type: "parent_info",
          parentFirstName: data.parentFirstName,
          parentLastName: data.parentLastName,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          parentRelation: data.parentRelation,
          parentOccupation: data.parentOccupation || null,
        }),
        JSON.stringify({
          type: "previous_school",
          previousSchool: data.previousSchool || null,
          previousClass: data.previousClass || null,
          previousGrade: data.previousGrade || null,
        }),
      ],
    },
  });

  // 4. Cache Clearing
  revalidatePath("/dashboard/admissions");
  
  return {
    success: true,
    data: { id: admission.id },
    message: "Admission application submitted successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Update Admission Status
// ─────────────────────────────────────────────────────────────

export async function updateAdmissionStatusAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = updateAdmissionStatusSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid request." };
  }

  const { id, status, remarks } = parsed.data;

  const admission = await db.admission.findFirst({
    where: { id, schoolId: session.user.schoolId },
  });

  if (!admission) {
    return { success: false, error: "Admission not found." };
  }

  await db.admission.update({
    where: { id },
    data: {
      status,
      remarks: remarks || null,
      reviewedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/admissions");
  revalidatePath(`/dashboard/admissions/${id}`);
  return {
    success: true,
    data: { id },
    message: `Application ${status.toLowerCase().replace("_", " ")}.`,
  };
}

// ─────────────────────────────────────────────────────────────
// Enroll Student (Accept + Create Student Account)
// ─────────────────────────────────────────────────────────────

export async function enrollStudentAction(
  values: unknown
): Promise<ActionResult<{ studentId: string; admissionNumber: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = enrollStudentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { admissionId, classId, sectionId, admissionDate, feeSetup } =
    parsed.data;

  const admission = await db.admission.findFirst({
    where: { id: admissionId, schoolId },
  });

  if (!admission) {
    return { success: false, error: "Admission not found." };
  }

  if (admission.status === "ENROLLED") {
    return { success: false, error: "Student already enrolled." };
  }

  // Parse parent info from documents
  const parentInfoDoc = admission.documents.find((d) => {
    try {
      return JSON.parse(d).type === "parent_info";
    } catch {
      return false;
    }
  });

  const parentInfo = parentInfoDoc ? JSON.parse(parentInfoDoc) : null;

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Generate unique admission number
      const admissionNumber = await generateAdmissionNumber(schoolId);

      // 2. Generate unique roll number
      const rollNumber = await generateRollNumber(schoolId, classId, sectionId);

      // 3. Create student user account
      const studentEmail = `${admissionNumber.toLowerCase().replace("-", "")}@student.school.com`;
      const hashedPassword = await hash("Student@123", 12);

      const user = await tx.user.create({
        data: {
          schoolId,
          email: studentEmail,
          password: hashedPassword,
          role: "STUDENT",
        },
      });

      // 4. Create student record
      const student = await tx.student.create({
        data: {
          schoolId,
          userId: user.id,
          firstName: admission.firstName,
          lastName: admission.lastName,
          dateOfBirth: admission.dateOfBirth,
          gender: admission.gender,
          phone: admission.phone,
          address: admission.address,
          city: admission.city,
          country: admission.country,
          religion: admission.religion,
          nationality: admission.nationality,
          admissionNumber,
          rollNumber,
          classId,
          sectionId: sectionId || null,
          admissionDate: new Date(admissionDate),
          isActive: true,
          createdBy: session.user.id,
        },
      });

      // 5. Create parent account if info available
      if (parentInfo) {
        const parentEmail = parentInfo.parentEmail;
        const existingParentUser = await tx.user.findUnique({
          where: { email: parentEmail },
        });

        let parentUserId: string;

        if (existingParentUser) {
          parentUserId = existingParentUser.id;
        } else {
          const parentHashedPwd = await hash("Parent@123", 12);
          const parentUser = await tx.user.create({
            data: {
              schoolId,
              email: parentEmail,
              password: parentHashedPwd,
              role: "PARENT",
            },
          });
          parentUserId = parentUser.id;
        }

        // Check if parent record exists
        let parentRecord = await tx.parent.findFirst({
          where: { userId: parentUserId },
        });

        if (!parentRecord) {
          parentRecord = await tx.parent.create({
            data: {
              schoolId,
              userId: parentUserId,
              firstName: parentInfo.parentFirstName,
              lastName: parentInfo.parentLastName,
              email: parentEmail,
              phone: parentInfo.parentPhone,
              occupation: parentInfo.parentOccupation || null,
            },
          });
        }

        // Link parent to student
        await tx.studentParent.create({
          data: {
            studentId: student.id,
            parentId: parentRecord.id,
            relation: parentInfo.parentRelation,
          },
        });
      }

      // 6. Assign fees if provided
      if (feeSetup && feeSetup.length > 0) {
        for (const fee of feeSetup) {
          if (fee.isMonthly) {
            // Create monthly fee records
            const baseDate = new Date(fee.dueDate);
            for (let i = 0; i < fee.monthsCount; i++) {
              const dueDate = new Date(baseDate);
              dueDate.setMonth(dueDate.getMonth() + i);

              await tx.fee.create({
                data: {
                  schoolId,
                  studentId: student.id,
                  feeTypeId: fee.feeTypeId,
                  amount: fee.amount,
                  discount: fee.discount,
                  dueDate,
                  status: "UNPAID",
                  createdBy: session.user.id,
                },
              });
            }
          } else {
            // One-time fee
            await tx.fee.create({
              data: {
                schoolId,
                studentId: student.id,
                feeTypeId: fee.feeTypeId,
                amount: fee.amount,
                discount: fee.discount,
                dueDate: new Date(fee.dueDate),
                status: "UNPAID",
                createdBy: session.user.id,
              },
            });
          }
        }
      }

      // 7. Update admission status to ENROLLED
      await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: "ENROLLED",
          reviewedBy: session.user.id,
        },
      });

      return { student, admissionNumber };
    });

    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard/students");

    return {
      success: true,
      data: {
        studentId: result.student.id,
        admissionNumber: result.admissionNumber,
      },
      message: `Student enrolled! Admission #: ${result.admissionNumber}, Roll #: ${result.student.rollNumber}`,
    };
  } catch (error) {
    console.error("Enroll student error:", error);
    return {
      success: false,
      error: "Failed to enroll student. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Get Admission Summary
// ─────────────────────────────────────────────────────────────

export async function getAdmissionSummary() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const [applied, underReview, accepted, enrolled, rejected] =
    await Promise.all([
      db.admission.count({ where: { schoolId, status: "APPLIED" } }),
      db.admission.count({ where: { schoolId, status: "UNDER_REVIEW" } }),
      db.admission.count({ where: { schoolId, status: "ACCEPTED" } }),
      db.admission.count({ where: { schoolId, status: "ENROLLED" } }),
      db.admission.count({ where: { schoolId, status: "REJECTED" } }),
    ]);

  return { applied, underReview, accepted, enrolled, rejected };
}