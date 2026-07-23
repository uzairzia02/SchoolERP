import { Type } from "@google/genai";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTeacherStats } from "@/features/dashboard/shared/actions/dashboard.actions";
import {
  getStudentsForAttendance,
  getAttendanceSummary,
} from "@/features/attendance/actions/attendance.actions";
import { getAssignments, getAssignmentById } from "@/features/assignments/actions/assignment.actions";
import { getExams, getResultSheet } from "@/features/exams/actions/exam.actions";

// ─────────────────────────────────────────────────────────────
// Helper — resolve the logged-in teacher + the set of classes
// they actually teach (from timetable), used to scope every tool
// so a teacher can never query another class's data.
// ─────────────────────────────────────────────────────────────

async function getTeacherContext() {
  const session = await auth();
  if (!session?.user) return null;

  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id, schoolId: session.user.schoolId, deletedAt: null },
    select: { id: true, schoolId: true },
  });
  if (!teacher) return null;

  const timetableRows = await db.timetable.findMany({
    where: { teacherId: teacher.id, schoolId: teacher.schoolId, isActive: true },
    select: {
      classId: true,
      sectionId: true,
      class: { select: { name: true, displayName: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    distinct: ["classId", "sectionId", "subjectId"],
  });

  const myClasses = timetableRows.map((r) => ({
    classId: r.classId,
    className: r.class.displayName,
    sectionId: r.sectionId,
    sectionName: r.section?.name ?? null,
    subjectId: r.subject.id,
    subjectName: r.subject.name,
  }));

  const myClassIds = new Set(myClasses.map((c) => c.classId));

  return { teacherId: teacher.id, schoolId: teacher.schoolId, myClasses, myClassIds };
}

// ─────────────────────────────────────────────────────────────
// Tool declarations
// ─────────────────────────────────────────────────────────────

export const teacherTools = [
  {
    functionDeclarations: [
      {
        name: "get_overview",
        description:
          "Get the teacher's dashboard overview: today's timetable/periods, pending leave requests, upcoming exams, whether today's attendance is marked, pending assignments count, and recent announcements.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_my_classes",
        description:
          "List the classes, sections, and subjects this teacher is assigned to teach (from the timetable). Use this first if the teacher's classId is not already known, or when they ask 'which classes do I teach'.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_class_attendance",
        description:
          "Get today's (or a given date's) attendance summary and the list of absent/late students for one of the teacher's own classes/sections. Only works for classes the teacher actually teaches.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            className: {
              type: Type.STRING,
              description: "Class display name as returned by get_my_classes, e.g. 'Grade 8'.",
            },
            sectionName: {
              type: Type.STRING,
              description: "Optional section name, e.g. 'A'.",
            },
            date: {
              type: Type.STRING,
              description: "Date in YYYY-MM-DD format. Defaults to today if omitted.",
            },
          },
          required: ["className"],
        },
      },
      {
        name: "get_my_assignments",
        description:
          "Get the list of assignments created by this teacher, including due dates, total marks, and how many students have submitted each one.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_assignment_submissions",
        description:
          "Get the full submission list (who submitted, marks, feedback, late status) for one specific assignment the teacher created. Call get_my_assignments first if the assignment title/id isn't already known.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            assignmentTitle: {
              type: Type.STRING,
              description: "Title of the assignment (as seen in get_my_assignments) to look up.",
            },
          },
          required: ["assignmentTitle"],
        },
      },
      {
        name: "get_my_exams",
        description:
          "Get upcoming/recent exams scheduled for the classes this teacher teaches.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_exam_results",
        description:
          "Get the class result sheet (per-student, per-subject marks and grades) for a specific exam, restricted to classes this teacher teaches.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            examName: {
              type: Type.STRING,
              description: "Name of the exam (as seen in get_my_exams) to fetch results for.",
            },
          },
          required: ["examName"],
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Executor
// ─────────────────────────────────────────────────────────────

export async function executeTeacherTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const ctx = await getTeacherContext();
  if (!ctx) return { error: "Could not resolve teacher profile for this account." };

  switch (name) {
    case "get_overview": {
      const stats = await getTeacherStats();
      if (!stats) return { error: "Could not load overview" };
      return {
        periodsToday: stats.periodsToday,
        myTimetableToday: stats.myTimetableToday,
        pendingLeave: stats.pendingLeave,
        upcomingExams: stats.upcomingExams,
        isAttendanceMarkedToday: stats.isAttendanceMarkedToday,
        pendingAssignments: stats.pendingAssignments,
        myAnnouncements: stats.myAnnouncements,
      };
    }

    case "get_my_classes": {
      return ctx.myClasses;
    }

    case "get_class_attendance": {
      const className = String(args.className ?? "");
      const sectionName = args.sectionName ? String(args.sectionName) : undefined;
      const date = args.date ? String(args.date) : new Date().toISOString().slice(0, 10);

      const match = ctx.myClasses.find(
        (c) =>
          c.className.toLowerCase() === className.toLowerCase() &&
          (!sectionName || c.sectionName?.toLowerCase() === sectionName.toLowerCase())
      );
      if (!match) {
        return { error: `You don't teach a class matching "${className}${sectionName ? " " + sectionName : ""}".` };
      }

      const [summary, students] = await Promise.all([
        getAttendanceSummary({ classId: match.classId, sectionId: match.sectionId ?? undefined, date }),
        getStudentsForAttendance({ classId: match.classId, sectionId: match.sectionId ?? undefined, date }),
      ]);

      const absentOrLate = students.success
        ? students.data
            .filter((s) => s.attendance?.status === "ABSENT" || s.attendance?.status === "LATE")
            .map((s) => ({ name: `${s.firstName} ${s.lastName}`, status: s.attendance?.status }))
        : [];

      return { date, summary, absentOrLate };
    }

    case "get_my_assignments": {
      const data = await getAssignments({ page: 1, pageSize: 20 });
      if (!data) return { error: "Could not load assignments" };
      return data.assignments;
    }

    case "get_assignment_submissions": {
      const title = String(args.assignmentTitle ?? "").toLowerCase();
      const list = await getAssignments({ page: 1, pageSize: 50, search: title });
      const found = list?.assignments.find((a) => a.title.toLowerCase().includes(title));
      if (!found) return { error: `No assignment found matching "${args.assignmentTitle}".` };

      const detail = await getAssignmentById(found.id);
      if (!detail || "mySubmission" in detail) return { error: "Could not load submissions" };
      return {
        title: detail.title,
        totalStudentsInClass: detail.totalStudentsInClass,
        submissions: detail.submissions,
      };
    }

    case "get_my_exams": {
      const classIds = Array.from(ctx.myClassIds);
      const results = await Promise.all(
        classIds.map((classId) => getExams({ classId, page: 1, pageSize: 10 }))
      );
      return results.flatMap((r) => r.data ?? []);
    }

    case "get_exam_results": {
      const examName = String(args.examName ?? "").toLowerCase();
      const classIds = Array.from(ctx.myClassIds);
      const results = await Promise.all(
        classIds.map((classId) => getExams({ classId, page: 1, pageSize: 20 }))
      );
      const allExams = results.flatMap((r) => r.data ?? []);
      const found = allExams.find((e) => e.name.toLowerCase().includes(examName));
      if (!found) return { error: `No exam found matching "${args.examName}" in your classes.` };

      const sheet = await getResultSheet(found.id);
      if (!sheet.success) return { error: sheet.error };
      return { examName: found.name, className: found.class.displayName, results: sheet.data };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}