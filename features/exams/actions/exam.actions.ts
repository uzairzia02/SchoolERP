"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { ExamType, Prisma } from "@prisma/client";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  type: z.enum(["MID_TERM", "FINAL", "QUIZ", "ASSIGNMENT", "PRACTICAL"]),
  classId: z.string().min(1, "Class is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalMarks: z.coerce.number().int().min(1),
  passingMarks: z.coerce.number().int().min(1),
  subjectIds: z.array(z.string()).min(1, "At least one subject required"),
  attachments: z.array(z.string().url()).default([]),
});

const gradeEntrySchema = z.object({
  examId: z.string().min(1),
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      subjectId: z.string().min(1),
      marksObt: z.coerce.number().min(0),
    })
  ),
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ExamListItem = {
  id: string;
  name: string;
  type: ExamType;
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  attachments: string[];
  createdAt: Date;
  class: { id: string; name: string; displayName: string };
  _count: { subjects: number; grades: number };
};

export type ExamDetail = ExamListItem & {
  subjects: {
    id: string;
    totalMarks: number;
    passingMarks: number;
    date: Date | null;
    subject: { id: string; name: string; code: string };
  }[];
};

export type StudentGradeRow = {
  studentId: string;
  name: string;
  admissionNumber: string;
  rollNumber: string | null;
  grades: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    totalMarks: number;
    marksObt: number | null;
    percentage: number | null;
    grade: string | null;
    gpa: number | null;
  }[];
  totalMarksObt: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  gpa: number;
  isPassed: boolean;
  position: number;
};

// ─────────────────────────────────────────────────────────────
// Grade Calculator
// ─────────────────────────────────────────────────────────────

async function calculateGrade(
  schoolId: string,
  percentage: number
): Promise<{ grade: string; gpa: number }> {
  const scales = await db.gradeScale.findMany({
    where: { schoolId },
    orderBy: { minMarks: "desc" },
  });

  if (scales.length === 0) {
    // Default Pakistani grading
    if (percentage >= 90) return { grade: "A+", gpa: 4.0 };
    if (percentage >= 80) return { grade: "A", gpa: 4.0 };
    if (percentage >= 70) return { grade: "B+", gpa: 3.3 };
    if (percentage >= 60) return { grade: "B", gpa: 3.0 };
    if (percentage >= 50) return { grade: "C", gpa: 2.0 };
    if (percentage >= 33) return { grade: "D", gpa: 1.0 };
    return { grade: "F", gpa: 0.0 };
  }

  for (const scale of scales) {
    if (percentage >= scale.minMarks && percentage <= scale.maxMarks) {
      return { grade: scale.grade, gpa: scale.gpa };
    }
  }

  return { grade: "F", gpa: 0.0 };
}

// ─────────────────────────────────────────────────────────────
// Get Exams
// ─────────────────────────────────────────────────────────────

export async function getExams(params: {
  page?: number;
  pageSize?: number;
  classId?: string;
  type?: ExamType;
  search?: string;
}): Promise<PaginatedResponse<ExamListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.ExamWhereInput = {
    schoolId,
    deletedAt: null,
    ...(params.classId && { classId: params.classId }),
    ...(params.type && { type: params.type }),
    ...(params.search && {
      name: { contains: params.search, mode: "insensitive" },
    }),
  };

  const [data, total] = await Promise.all([
    db.exam.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        totalMarks: true,
        passingMarks: true,
        isPublished: true,
        attachments: true,
        createdAt: true,
        class: { select: { id: true, name: true, displayName: true } },
        _count: { select: { subjects: true, grades: true } },
      },
    }),
    db.exam.count({ where }),
  ]);

  return buildPaginatedResponse(data as ExamListItem[], total, page, pageSize);
}

// ─────────────────────────────────────────────────────────────
// Get Exam by ID
// ─────────────────────────────────────────────────────────────

export async function getExamById(
  id: string
): Promise<ActionResult<ExamDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const exam = await db.exam.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
      totalMarks: true,
      passingMarks: true,
      isPublished: true,
      attachments: true,
      createdAt: true,
      class: { select: { id: true, name: true, displayName: true } },
      _count: { select: { subjects: true, grades: true } },
      subjects: {
        select: {
          id: true,
          totalMarks: true,
          passingMarks: true,
          date: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!exam) return { success: false, error: "Exam not found." };

  return { success: true, data: exam as ExamDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Exam
// ─────────────────────────────────────────────────────────────

export async function createExamAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Management Roles Verification Guard
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "TEACHER"]);

  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  // 2. Data Validation
  const parsed = examSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
  
    const exam = await db.$transaction(async (tx) => {
      // Step A: Create the core Exam record
      const newExam = await tx.exam.create({
        data: {
          schoolId,
          name: data.name,
          type: data.type,
          classId: data.classId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          totalMarks: data.totalMarks,
          passingMarks: data.passingMarks,
          attachments: data.attachments || [],
          createdBy: session.user.id,
        },
      });

      // Step B: Bulk-insert related exam subjects linking to the newly created exam ID
      await tx.examSubject.createMany({
        data: data.subjectIds.map((subjectId) => ({
          examId: newExam.id,
          subjectId,
          totalMarks: data.totalMarks, // Agar har subject ke marks dynamic hain toh schema ke mutabiq map karein
          passingMarks: data.passingMarks,
        })),
      });

      return newExam;
    });

    // 4. Cache Purge & Success Response
    revalidatePath("/dashboard/exams");
    
    return {
      success: true,
      data: { id: exam.id },
      message: "Exam created successfully along with scheduled subjects.",
    };

  } catch (error) {
    console.error("Failed to create exam transaction:", error);
    return {
      success: false,
      error: "Something went wrong while setting up the exam data. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delete Exam
// ─────────────────────────────────────────────────────────────

export async function deleteExamAction(
  id: string
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "TEACHER"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.exam.update({
    where: { id, schoolId: session.user.schoolId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/exams");
  return { success: true, data: null, message: "Exam deleted." };
}

// ─────────────────────────────────────────────────────────────
// Toggle Publish
// ─────────────────────────────────────────────────────────────

export async function toggleExamPublishAction(
  id: string,
  isPublished: boolean
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "TEACHER"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.exam.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isPublished },
  });

  revalidatePath("/dashboard/exams");
  revalidatePath(`/dashboard/exams/${id}`);
  return {
    success: true,
    data: null,
    message: isPublished ? "Results published." : "Results unpublished.",
  };
}

// ─────────────────────────────────────────────────────────────
// Get Students for Grade Entry
// ─────────────────────────────────────────────────────────────

export async function getStudentsForGradeEntry(examId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId, deletedAt: null },
    select: {
      id: true,
      classId: true,
      totalMarks: true,
      passingMarks: true,
      subjects: {
        select: {
          id: true,
          totalMarks: true,
          passingMarks: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!exam) return null;

  const students = await db.student.findMany({
    where: {
      schoolId,
      classId: exam.classId,
      isActive: true,
      deletedAt: null,
    },
    orderBy: [{ rollNumber: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      rollNumber: true,
      grades: {
        where: { examId },
        select: {
          subjectId: true,
          marksObt: true,
          percentage: true,
          grade: true,
          gpa: true,
        },
      },
    },
  });

  return { exam, students };
}

// ─────────────────────────────────────────────────────────────
// Save Grades
// ─────────────────────────────────────────────────────────────

export async function saveGradesAction(
  values: unknown
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "TEACHER"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = gradeEntrySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid data." };
  }

  const { examId, grades } = parsed.data;

  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    select: {
      totalMarks: true,
      subjects: { select: { subjectId: true, totalMarks: true, passingMarks: true } },
    },
  });

  if (!exam) return { success: false, error: "Exam not found." };

  await db.$transaction(async (tx) => {
    for (const grade of grades) {
      const examSubject = exam.subjects.find((s) => s.subjectId === grade.subjectId);
      const totalMarks = examSubject?.totalMarks ?? exam.totalMarks;

      const percentage = totalMarks > 0
        ? Math.round((grade.marksObt / totalMarks) * 100 * 10) / 10
        : 0;

      const { grade: gradeLetter, gpa } = await calculateGrade(schoolId, percentage);

      await tx.grade.upsert({
        where: {
          studentId_examId_subjectId: {
            studentId: grade.studentId,
            examId,
            subjectId: grade.subjectId,
          },
        },
        update: {
          marksObt: grade.marksObt,
          totalMarks,
          percentage,
          grade: gradeLetter,
          gpa,
          createdBy: session.user.id,
        },
        create: {
          schoolId,
          studentId: grade.studentId,
          examId,
          subjectId: grade.subjectId,
          marksObt: grade.marksObt,
          totalMarks,
          percentage,
          grade: gradeLetter,
          gpa,
          createdBy: session.user.id,
        },
      });
    }
  });

  revalidatePath(`/dashboard/exams/${examId}/grades`);
  return { success: true, data: null, message: "Grades saved successfully." };
}

// ─────────────────────────────────────────────────────────────
// Get Result Sheet
// ─────────────────────────────────────────────────────────────

export async function getResultSheet(
  examId: string
): Promise<ActionResult<StudentGradeRow[]>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId, deletedAt: null },
    select: {
      passingMarks: true,
      classId: true,
      subjects: {
        select: {
          subjectId: true,
          totalMarks: true,
          passingMarks: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!exam) return { success: false, error: "Exam not found." };

  const students = await db.student.findMany({
    where: { schoolId, classId: exam.classId, isActive: true, deletedAt: null },
    orderBy: [{ rollNumber: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      rollNumber: true,
      grades: {
        where: { examId },
        select: {
          subjectId: true,
          marksObt: true,
          totalMarks: true,
          percentage: true,
          grade: true,
          gpa: true,
        },
      },
    },
  });

  const rows: StudentGradeRow[] = students.map((student) => {
    const subjectGrades = exam.subjects.map((es) => {
      const grade = student.grades.find((g) => g.subjectId === es.subjectId);
      return {
        subjectId: es.subjectId,
        subjectName: es.subject.name,
        subjectCode: es.subject.code,
        totalMarks: es.totalMarks,
        marksObt: grade ? Number(grade.marksObt) : null,
        percentage: grade ? Number(grade.percentage) : null,
        grade: grade?.grade ?? null,
        gpa: grade?.gpa ? Number(grade.gpa) : null,
      };
    });

    const totalMarksObt = subjectGrades.reduce(
      (s, g) => s + (g.marksObt ?? 0),
      0
    );
    const totalMarks = subjectGrades.reduce((s, g) => s + g.totalMarks, 0);
    const percentage =
      totalMarks > 0
        ? Math.round((totalMarksObt / totalMarks) * 100 * 10) / 10
        : 0;

    const passedAll = subjectGrades.every(
      (g) =>
        g.marksObt !== null &&
        g.marksObt >= (exam.subjects.find((s) => s.subjectId === g.subjectId)?.passingMarks ?? exam.passingMarks)
    );

    return {
      studentId: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      grades: subjectGrades,
      totalMarksObt,
      totalMarks,
      percentage,
      grade: percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : percentage >= 33 ? "D" : "F",
      gpa: percentage >= 80 ? 4.0 : percentage >= 70 ? 3.3 : percentage >= 60 ? 3.0 : percentage >= 50 ? 2.0 : percentage >= 33 ? 1.0 : 0.0,
      isPassed: passedAll && percentage >= exam.passingMarks,
      position: 0,
    };
  });

  // Sort by percentage descending and assign positions
  rows.sort((a, b) => b.percentage - a.percentage);
  rows.forEach((row, index) => {
    row.position = index + 1;
  });

  return { success: true, data: rows };
}