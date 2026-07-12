"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { studentSchema, studentUpdateSchema } from "@/features/students/schemas/student.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type StudentListItem = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  gender: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  user: { email: string };
};

export type StudentDetail = StudentListItem & {
  dateOfBirth: Date;
  bloodGroup: string | null;
  religion: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  rollNumber: string | null;
  admissionDate: Date;
  parents: {
    relation: string;
    parent: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }[];
};

// ─────────────────────────────────────────────────────────────
// Get Students (paginated + search)
// ─────────────────────────────────────────────────────────────

export async function getStudents(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  classId?: string;
  sectionId?: string;
  isActive?: boolean;
}): Promise<PaginatedResponse<StudentListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.StudentWhereInput = {
    schoolId,
    deletedAt: null,
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { admissionNumber: { contains: params.search, mode: "insensitive" } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
      ],
    }),
    ...(params.classId && { classId: params.classId }),
    ...(params.sectionId && { sectionId: params.sectionId }),
    ...(params.isActive !== undefined && { isActive: params.isActive }),
  };

  const [data, total] = await Promise.all([
    db.student.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        gender: true,
        phone: true,
        isActive: true,
        createdAt: true,
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        user: { select: { email: true } },
      },
    }),
    db.student.count({ where }),
  ]);

  return buildPaginatedResponse(data as StudentListItem[], total, page, pageSize);
}

// ─────────────────────────────────────────────────────────────
// Get Student by ID
// ─────────────────────────────────────────────────────────────

export async function getStudentById(
  id: string
): Promise<ActionResult<StudentDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const student = await db.student.findFirst({
    where: { id, schoolId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      gender: true,
      dateOfBirth: true,
      bloodGroup: true,
      religion: true,
      nationality: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
      rollNumber: true,
      admissionDate: true,
      isActive: true,
      createdAt: true,
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      user: { select: { email: true } },
      parents: {
        select: {
          relation: true,
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return { success: false, error: "Student not found." };
  }

  return { success: true, data: student as StudentDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Student
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Create Student
// ─────────────────────────────────────────────────────────────

const PHONE_REGEX = /^03\d{2}-?\d{7}$/;

function normalizePhone(phone: string): string {
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
}

export async function createStudentAction(
  values: unknown
): Promise<ActionResult<{ id: string; admissionNumber: string; studentEmail: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["PRINCIPAL", "HR", "SUPER_ADMIN"].includes(session.user.role)) {
    return { success: false, error: "You don't have permission to create students." };
  }

  const schoolId = session.user.schoolId;

  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  if (data.parentPhone && !PHONE_REGEX.test(data.parentPhone)) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: { parentPhone: ["Phone must be in the format 03xx-xxxxxxx"] },
    };
  }

  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return { success: false, error: "School not found." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // ── Generate the next student ID for this school ──
      const updatedSchool = await tx.school.update({
        where: { id: schoolId },
        data: { studentSequence: { increment: 1 } },
        select: { studentSequence: true },
      });

      const admissionNumber = `STU-${String(updatedSchool.studentSequence).padStart(4, "0")}`;
      const studentEmail = `${admissionNumber.toLowerCase()}@${school.code.toLowerCase()}.scholarsync.com`;
      const hashedPassword = await hash("Test@123", 12);

      const user = await tx.user.create({
        data: {
          schoolId,
          email: studentEmail,
          password: hashedPassword,
          role: "STUDENT",
        },
      });

      const student = await tx.student.create({
        data: {
          schoolId,
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          bloodGroup: data.bloodGroup ?? null,
          religion: data.religion ?? null,
          nationality: data.nationality ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          country: data.country ?? null,
          zipCode: data.zipCode ?? null,
          classId: data.classId ?? null,
          sectionId: data.sectionId ?? null,
          rollNumber: data.rollNumber ?? null,
          admissionNumber,
          admissionDate: new Date(data.admissionDate),
          createdBy: session.user.id,
        },
      });

      // ── Parent handling: link to existing parent by phone, or create new ──
      if (data.parentFirstName && data.parentPhone) {
        const normalizedPhone = normalizePhone(data.parentPhone);

        const existingParent = await tx.parent.findFirst({
          where: { schoolId, phone: normalizedPhone },
        });

        let parentId: string;

        if (existingParent) {
          parentId = existingParent.id;
        } else {
          const parentEmail = `${normalizedPhone.replace("-", "")}@${school.code.toLowerCase()}.scholarsync.com`;
          const parentPassword = await hash("Test@123", 12);

          const parentUser = await tx.user.create({
            data: {
              schoolId,
              email: parentEmail,
              password: parentPassword,
              role: "PARENT",
            },
          });

          const newParent = await tx.parent.create({
            data: {
              schoolId,
              userId: parentUser.id,
              firstName: data.parentFirstName,
              lastName: data.parentLastName ?? "",
              email: parentEmail,
              phone: normalizedPhone,
            },
          });

          parentId = newParent.id;
        }

        await tx.studentParent.create({
          data: {
            studentId: student.id,
            parentId,
            relation: data.parentRelation ?? "Guardian",
          },
        });
      }

      // ── Auto-assign fees: all recurring fee types + any "Admission Fee" ──
      const schoolFeeTypes = await tx.feeType.findMany({ where: { schoolId } });

      const feeTypesToAssign = schoolFeeTypes.filter(
        (ft) => ft.isRecurring || /admission/i.test(ft.name)
      );

      if (feeTypesToAssign.length > 0) {
        const dueDate = new Date(data.admissionDate);
        dueDate.setDate(dueDate.getDate() + 7);

        await tx.fee.createMany({
          data: feeTypesToAssign.map((ft) => ({
            schoolId,
            studentId: student.id,
            feeTypeId: ft.id,
            amount: ft.amount,
            dueDate,
          })),
        });
      }

      return { student, admissionNumber, studentEmail, feesAssigned: feeTypesToAssign.length };
    });

    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/fees");
    return {
      success: true,
      data: {
        id: result.student.id,
        admissionNumber: result.admissionNumber,
        studentEmail: result.studentEmail,
      },
      message: `Student created successfully. ${result.feesAssigned} fee record(s) assigned. Login: ${result.studentEmail} / Test@123`,
    };
  } catch (error) {
    console.error("Create student error:", error);
    return { success: false, error: "Failed to create student. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Student
// ─────────────────────────────────────────────────────────────

export async function updateStudentAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = studentUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  const student = await db.student.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!student) {
    return { success: false, error: "Student not found." };
  }

  await db.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      bloodGroup: data.bloodGroup ?? null,
      religion: data.religion ?? null,
      nationality: data.nationality ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      country: data.country ?? null,
      zipCode: data.zipCode ?? null,
      classId: data.classId ?? null,
      sectionId: data.sectionId ?? null,
      rollNumber: data.rollNumber ?? null,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${id}`);
  return { success: true, data: { id }, message: "Student updated successfully." };
}

// ─────────────────────────────────────────────────────────────
// Delete Student (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteStudentAction(
  id: string
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const student = await db.student.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!student) {
    return { success: false, error: "Student not found." };
  }

  await db.student.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/students");
  return { success: true, data: null, message: "Student deleted successfully." };
}

// ─────────────────────────────────────────────────────────────
// Get Classes (for dropdowns)
// ─────────────────────────────────────────────────────────────

export async function getClassesForSelect() {
  const session = await auth();
  if (!session?.user) return [];

  const classes = await db.class.findMany({
    where: { schoolId: session.user.schoolId, isActive: true, deletedAt: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, displayName: true },
  });

  return classes;
}

export async function getSectionsForSelect(classId: string) {
  const session = await auth();
  if (!session?.user) return [];

  const sections = await db.section.findMany({
    where: {
      classId,
      schoolId: session.user.schoolId,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return sections;
}