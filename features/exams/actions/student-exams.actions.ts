"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getStudentExams() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "STUDENT") return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
  });

  if (!student?.classId) return { exams: [] };

  const exams = await db.exam.findMany({
    where: {
      schoolId: session.user.schoolId,
      classId: student.classId,
      isPublished: true,
      deletedAt: null,
    },
    include: {
      subjects: {
        select: {
          totalMarks: true,
          date: true,
          subject: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return {
    exams: exams.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      totalMarks: e.totalMarks,
      passingMarks: e.passingMarks,
      attachments: e.attachments,
      subjects: e.subjects.map((s) => ({
        name: s.subject.name,
        code: s.subject.code,
        totalMarks: s.totalMarks,
        date: s.date,
      })),
    })),
  };
}
