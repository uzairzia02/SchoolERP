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

export async function createStudentAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

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

  // Check duplicate admission number
  const existing = await db.student.findFirst({
    where: { schoolId, admissionNumber: data.admissionNumber, deletedAt: null },
  });
  if (existing) {
    return {
      success: false,
      error: "Admission number already exists.",
      fieldErrors: { admissionNumber: ["This admission number is already taken."] },
    };
  }

  // Generate email and password for student user account
  const email = `${data.admissionNumber.toLowerCase()}@student.school.com`;
  const hashedPassword = await hash("Student@123", 12);

  try {
    const result = await db.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          schoolId,
          email,
          password: hashedPassword,
          role: "STUDENT",
        },
      });

      // Create student
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
          admissionNumber: data.admissionNumber,
          admissionDate: new Date(data.admissionDate),
          createdBy: session.user.id,
        },
      });

      // Create parent if provided
      if (data.parentFirstName && data.parentPhone) {
        const parentEmail =
          data.parentEmail ||
          `parent.${data.admissionNumber.toLowerCase()}@school.com`;
        const parentPassword = await hash("Parent@123", 12);

        const parentUser = await tx.user.create({
          data: {
            schoolId,
            email: parentEmail,
            password: parentPassword,
            role: "PARENT",
          },
        });

        const parent = await tx.parent.create({
          data: {
            schoolId,
            userId: parentUser.id,
            firstName: data.parentFirstName,
            lastName: data.parentLastName ?? "",
            email: parentEmail,
            phone: data.parentPhone,
          },
        });

        await tx.studentParent.create({
          data: {
            studentId: student.id,
            parentId: parent.id,
            relation: data.parentRelation ?? "Guardian",
          },
        });
      }

      return student;
    });

    revalidatePath("/dashboard/students");
    return { success: true, data: { id: result.id }, message: "Student created successfully." };
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