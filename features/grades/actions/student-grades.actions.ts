"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getStudentGrades() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "STUDENT") return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      class: { select: { displayName: true } },
      section: { select: { name: true } },
    },
  });

  if (!student) return null;

  const grades = await db.grade.findMany({
    where: { studentId: student.id },
    include: {
      exam: { select: { name: true, type: true, startDate: true } },
      subject: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by exam for a cleaner report-card style view
  const examGroups = new Map<
    string,
    {
      examName: string;
      examType: string;
      examDate: Date;
      subjects: { subject: string; marksObt: number; totalMarks: number; grade: string; percentage: number }[];
    }
  >();

  for (const g of grades) {
    const key = `${g.exam.name}-${g.exam.startDate.toISOString()}`;
    if (!examGroups.has(key)) {
      examGroups.set(key, {
        examName: g.exam.name,
        examType: g.exam.type,
        examDate: g.exam.startDate,
        subjects: [],
      });
    }
    examGroups.get(key)!.subjects.push({
      subject: g.subject.name,
      marksObt: Number(g.marksObt),
      totalMarks: Number(g.totalMarks),
      grade: g.grade,
      percentage: Number(g.percentage),
    });
  }

  const examReports = Array.from(examGroups.values())
    .map((e) => ({
      ...e,
      totalObtained: e.subjects.reduce((sum, s) => sum + s.marksObt, 0),
      totalMax: e.subjects.reduce((sum, s) => sum + s.totalMarks, 0),
      averagePercentage:
        e.subjects.length > 0
          ? Math.round((e.subjects.reduce((sum, s) => sum + s.percentage, 0) / e.subjects.length) * 10) / 10
          : 0,
    }))
    .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

  const overallAverage =
    grades.length > 0
      ? Math.round((grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length) * 10) / 10
      : 0;

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    sectionName: student.section?.name ?? "N/A",
    overallAverage,
    totalExamsGraded: examReports.length,
    examReports,
  };
}
