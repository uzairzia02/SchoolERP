"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getChildrenAssignments() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: { students: { include: { student: true } } },
  });

  if (!parent) return null;

  const results = [];

  for (const { student } of parent.students) {
    if (!student.classId) continue;

    const assignments = await db.assignment.findMany({
      where: { classId: student.classId, isActive: true, deletedAt: null },
      include: { subject: { select: { name: true } } },
      orderBy: { dueDate: "desc" },
      take: 10,
    });

    const submissions = await db.assignmentSubmission.findMany({
      where: {
        studentId: student.id,
        assignmentId: { in: assignments.map((a) => a.id) },
      },
      select: { assignmentId: true, marksObt: true },
    });
    const submissionMap = new Map(submissions.map((s) => [s.assignmentId, s.marksObt]));

    for (const a of assignments) {
      results.push({
        id: a.id,
        childName: `${student.firstName} ${student.lastName}`,
        title: a.title,
        subject: a.subject.name,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        isSubmitted: submissionMap.has(a.id),
        marksObt: submissionMap.get(a.id) ? Number(submissionMap.get(a.id)) : null,
      });
    }
  }

  return results.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
}