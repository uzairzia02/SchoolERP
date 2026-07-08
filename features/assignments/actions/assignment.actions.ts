"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  type SubmitAssignmentInput,
  type GradeSubmissionInput,
} from "../schemas/assignment.schema";

const TEACHING_ROLES = ["TEACHER", "FACULTY"];
const ADMIN_ROLES = ["PRINCIPAL", "SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

export async function createAssignment(input: CreateAssignmentInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!TEACHING_ROLES.includes(session.user.role)) {
    return { success: false, error: "Only teachers can create assignments" };
  }

  const parsed = createAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacher) {
    return { success: false, error: "Teacher profile not found" };
  }

  try {
    const assignment = await db.assignment.create({
      data: {
        schoolId: session.user.schoolId,
        teacherId: teacher.id,
        subjectId: parsed.data.subjectId,
        classId: parsed.data.classId,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate,
        totalMarks: parsed.data.totalMarks,
        attachments: parsed.data.attachments,
      },
    });

    revalidatePath("/dashboard/assignments");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("createAssignment error:", error);
    return { success: false, error: "Failed to create assignment" };
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateAssignment(input: UpdateAssignmentInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = updateAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { id, ...data } = parsed.data;

  const existing = await db.assignment.findUnique({ where: { id } });
  if (!existing || existing.schoolId !== session.user.schoolId) {
    return { success: false, error: "Assignment not found" };
  }

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  const isOwner = teacher?.id === existing.teacherId;
  const isAdmin = ADMIN_ROLES.includes(session.user.role);

  if (!isOwner && !isAdmin) {
    return { success: false, error: "You can only edit your own assignments" };
  }

  try {
    const updated = await db.assignment.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/assignments");
    revalidatePath(`/dashboard/assignments/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateAssignment error:", error);
    return { success: false, error: "Failed to update assignment" };
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteAssignment(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const existing = await db.assignment.findUnique({ where: { id } });
  if (!existing || existing.schoolId !== session.user.schoolId) {
    return { success: false, error: "Assignment not found" };
  }

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  const isOwner = teacher?.id === existing.teacherId;
  const isAdmin = ADMIN_ROLES.includes(session.user.role);

  if (!isOwner && !isAdmin) {
    return { success: false, error: "You can only delete your own assignments" };
  }

  try {
    await db.assignment.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error) {
    console.error("deleteAssignment error:", error);
    return { success: false, error: "Failed to delete assignment" };
  }
}

// ─────────────────────────────────────────────────────────────
// LIST (role-aware)
// ─────────────────────────────────────────────────────────────

export async function getAssignments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  classId?: string;
  subjectId?: string;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { page = 1, pageSize = 10, search, classId, subjectId } = params;
  const schoolId = session.user.schoolId;

  const where: any = {
    schoolId,
    deletedAt: null,
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    ...(classId ? { classId } : {}),
    ...(subjectId ? { subjectId } : {}),
  };

  // Teachers only see their own assignments
  if (TEACHING_ROLES.includes(session.user.role)) {
    const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
    if (teacher) where.teacherId = teacher.id;
  }

  // Students only see assignments for their class
  if (session.user.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (student?.classId) where.classId = student.classId;
    else return { assignments: [], total: 0, page, pageSize };
  }

  const [assignments, total] = await Promise.all([
    db.assignment.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        class: { select: { displayName: true } },
        teacher: { select: { firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.assignment.count({ where }),
  ]);

  // For students, attach their own submission status
  let studentSubmissionMap = new Map<string, { id: string; marksObt: number | null }>();
  if (session.user.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    if (student) {
      const submissions = await db.assignmentSubmission.findMany({
        where: { studentId: student.id, assignmentId: { in: assignments.map((a) => a.id) } },
        select: { id: true, assignmentId: true, marksObt: true },
      });
      studentSubmissionMap = new Map(
        submissions.map((s) => [s.assignmentId, { id: s.id, marksObt: s.marksObt ? Number(s.marksObt) : null }])
      );
    }
  }

  return {
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject.name,
      className: a.class?.displayName ?? "N/A",
      teacherName: `${a.teacher.firstName} ${a.teacher.lastName}`,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      submissionCount: a._count.submissions,
      isActive: a.isActive,
      mySubmission: studentSubmissionMap.get(a.id) ?? null,
    })),
    total,
    page,
    pageSize,
  };
}

// ─────────────────────────────────────────────────────────────
// GET SINGLE (with submissions for teacher/admin, own submission for student)
// ─────────────────────────────────────────────────────────────

export async function getAssignmentById(id: string) {
  const session = await auth();
  if (!session?.user) return null;

  const assignment = await db.assignment.findUnique({
    where: { id, schoolId: session.user.schoolId },
    include: {
      subject: { select: { name: true } },
      class: { select: { displayName: true, id: true } },
      teacher: { select: { firstName: true, lastName: true, id: true } },
    },
  });

  if (!assignment) return null;

  const base = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    subjectId: assignment.subjectId,
    subject: assignment.subject.name,
    classId: assignment.classId,
    className: assignment.class?.displayName ?? "N/A",
    teacherId: assignment.teacherId,
    teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
    dueDate: assignment.dueDate,
    totalMarks: assignment.totalMarks,
    attachments: assignment.attachments,
    isActive: assignment.isActive,
  };

  if (session.user.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: session.user.id } });
    const mySubmission = student
      ? await db.assignmentSubmission.findUnique({
          where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
        })
      : null;

    return {
      ...base,
      mySubmission: mySubmission
        ? {
            id: mySubmission.id,
            content: mySubmission.content,
            attachments: mySubmission.attachments,
            marksObt: mySubmission.marksObt ? Number(mySubmission.marksObt) : null,
            feedback: mySubmission.feedback,
            submittedAt: mySubmission.submittedAt,
            isLate: mySubmission.isLate,
          }
        : null,
    };
  }

  // Teacher / Admin — include full submissions list
  const totalStudentsInClass = await db.student.count({
    where: { classId: assignment.classId ?? undefined, isActive: true },
  });

  const submissions = await db.assignmentSubmission.findMany({
    where: { assignmentId: id },
    include: {
      student: { select: { firstName: true, lastName: true, admissionNumber: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return {
    ...base,
    totalStudentsInClass,
    submissions: submissions.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: `${s.student.firstName} ${s.student.lastName}`,
      admissionNumber: s.student.admissionNumber,
      content: s.content,
      attachments: s.attachments,
      marksObt: s.marksObt ? Number(s.marksObt) : null,
      feedback: s.feedback,
      submittedAt: s.submittedAt,
      isLate: s.isLate,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// STUDENT SUBMIT
// ─────────────────────────────────────────────────────────────

export async function submitAssignment(input: SubmitAssignmentInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (session.user.role !== "STUDENT") {
    return { success: false, error: "Only students can submit assignments" };
  }

  const parsed = submitAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return { success: false, error: "Student profile not found" };

  const assignment = await db.assignment.findUnique({ where: { id: parsed.data.assignmentId } });
  if (!assignment || !assignment.isActive) {
    return { success: false, error: "Assignment not found or no longer active" };
  }
  if (assignment.classId !== student.classId) {
    return { success: false, error: "This assignment is not assigned to your class" };
  }

  const isLate = new Date() > new Date(assignment.dueDate);

  try {
    const submission = await db.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: parsed.data.assignmentId,
          studentId: student.id,
        },
      },
      update: {
        content: parsed.data.content,
        attachments: parsed.data.attachments,
        submittedAt: new Date(),
        isLate,
      },
      create: {
        assignmentId: parsed.data.assignmentId,
        studentId: student.id,
        content: parsed.data.content,
        attachments: parsed.data.attachments,
        isLate,
      },
    });

    revalidatePath(`/dashboard/student/assignments/${parsed.data.assignmentId}`);
    revalidatePath("/dashboard/student/assignments");
    return { success: true, data: submission };
  } catch (error) {
    console.error("submitAssignment error:", error);
    return { success: false, error: "Failed to submit assignment" };
  }
}

// ─────────────────────────────────────────────────────────────
// TEACHER GRADE SUBMISSION
// ─────────────────────────────────────────────────────────────

export async function gradeSubmission(input: GradeSubmissionInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (![...TEACHING_ROLES, ...ADMIN_ROLES].includes(session.user.role)) {
    return { success: false, error: "You do not have permission to grade submissions" };
  }

  const parsed = gradeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const submission = await db.assignmentSubmission.findUnique({
    where: { id: parsed.data.submissionId },
    include: { assignment: true },
  });

  if (!submission) return { success: false, error: "Submission not found" };

  if (submission.assignment.totalMarks && parsed.data.marksObt > submission.assignment.totalMarks) {
    return { success: false, error: `Marks cannot exceed total marks (${submission.assignment.totalMarks})` };
  }

  try {
    const updated = await db.assignmentSubmission.update({
      where: { id: parsed.data.submissionId },
      data: {
        marksObt: parsed.data.marksObt,
        feedback: parsed.data.feedback,
      },
    });

    revalidatePath(`/dashboard/assignments/${submission.assignmentId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("gradeSubmission error:", error);
    return { success: false, error: "Failed to save grade" };
  }
}

// ─────────────────────────────────────────────────────────────
// SUPPORT DATA (for form dropdowns)
// ─────────────────────────────────────────────────────────────

export async function getAssignmentFormOptions() {
  const session = await auth();
  if (!session?.user) return { classes: [], subjects: [] };

  const schoolId = session.user.schoolId;

  const teacher = TEACHING_ROLES.includes(session.user.role)
    ? await db.teacher.findUnique({
        where: { userId: session.user.id },
        include: { subjects: { include: { subject: { include: { class: true } } } } },
      })
    : null;

  if (teacher) {
    const subjects = teacher.subjects.map((ts) => ts.subject);
    const classes = Array.from(
      new Map(subjects.filter((s) => s.class).map((s) => [s.class!.id, s.class!])).values()
    );
    return {
      classes: classes.map((c) => ({ id: c.id, name: c.displayName })),
      subjects: subjects.map((s) => ({ id: s.id, name: s.name, classId: s.classId })),
    };
  }

  // Admins can assign to any class/subject
  const [classes, subjects] = await Promise.all([
    db.class.findMany({ where: { schoolId, isActive: true }, select: { id: true, displayName: true } }),
    db.subject.findMany({ where: { schoolId, isActive: true }, select: { id: true, name: true, classId: true } }),
  ]);

  return {
    classes: classes.map((c) => ({ id: c.id, name: c.displayName })),
    subjects: subjects.map((s) => ({ id: s.id, name: s.name, classId: s.classId })),
  };
}
