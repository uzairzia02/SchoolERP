"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeeStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Shared helper — verifies this child actually belongs to the
// logged-in parent before returning any data. Prevents parents
// from viewing other people's children by guessing/typing IDs.
// ─────────────────────────────────────────────────────────────

async function getVerifiedChild(studentId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") return null;

  const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return null;

  const link = await db.studentParent.findFirst({
    where: { parentId: parent.id, studentId },
    include: {
      student: {
        include: {
          class: { select: { displayName: true } },
          section: { select: { name: true } },
        },
      },
    },
  });

  if (!link) return null; // not this parent's child — treat as not found

  return link.student;
}

// ─────────────────────────────────────────────────────────────
// Grades
// ─────────────────────────────────────────────────────────────

export async function getChildGrades(studentId: string) {
  const student = await getVerifiedChild(studentId);
  if (!student) return null;

  const grades = await db.grade.findMany({
    where: { studentId: student.id },
    include: {
      exam: { select: { name: true, type: true, startDate: true } },
      subject: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const examGroups = new Map<
    string,
    {
      examName: string;
      examType: string;
      examDate: Date;
      subjects: { subject: string; marksObt: number; totalMarks: number; grade: string }[];
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
    });
  }

  const examReports = Array.from(examGroups.values())
    .map((e) => ({
      ...e,
      totalObtained: e.subjects.reduce((sum, s) => sum + s.marksObt, 0),
      totalMax: e.subjects.reduce((sum, s) => sum + s.totalMarks, 0),
    }))
    .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    sectionName: student.section?.name ?? "N/A",
    examReports,
  };
}

// ─────────────────────────────────────────────────────────────
// Fees
// ─────────────────────────────────────────────────────────────

export async function getChildFees(studentId: string) {
  const student = await getVerifiedChild(studentId);
  if (!student) return null;

  const fees = await db.fee.findMany({
    where: { studentId: student.id },
    include: { feeType: { select: { name: true } } },
    orderBy: { dueDate: "desc" },
  });

  const totalOutstanding = fees
    .filter((f) => f.status !== FeeStatus.PAID)
    .reduce(
      (sum, f) =>
        sum + Number(f.amount) + Number(f.fine) - Number(f.discount) - Number(f.paidAmount),
      0
    );

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    totalOutstanding,
    fees: fees.map((f) => ({
      id: f.id,
      feeType: f.feeType.name,
      amount: Number(f.amount),
      discount: Number(f.discount),
      fine: Number(f.fine),
      paidAmount: Number(f.paidAmount),
      dueDate: f.dueDate,
      paidDate: f.paidDate,
      status: f.status,
      receiptNumber: f.receiptNumber,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────

export async function getChildAttendance(studentId: string) {
  const student = await getVerifiedChild(studentId);
  if (!student) return null;

  const records = await db.studentAttendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 60, // last ~2 months of records
  });

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const percentage =
    records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    percentage,
    records: records.map((r) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      remarks: r.remarks,
    })),
  };
}