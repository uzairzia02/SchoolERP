import { Type } from "@google/genai";
import { getStudentStats } from "@/features/dashboard/shared/actions/student.actions";
import { getStudentGrades } from "@/features/grades/actions/student-grades.actions";
import { getAssignments } from "@/features/assignments/actions/assignment.actions";
import { getStudentExams } from "@/features/exams/actions/student-exams.actions";

// ─────────────────────────────────────────────────────────────
// Tool declarations — schema Gemini uses to decide when/how to call
// ─────────────────────────────────────────────────────────────

export const studentTools = [
  {
    functionDeclarations: [
      {
        name: "get_overview",
        description:
          "Get a quick overview of the student's attendance percentage, today's classes, pending assignment count, and outstanding fees total. Use this for general 'how am I doing' questions.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_grades",
        description:
          "Get the student's full exam results and grades, grouped by exam, including subject-wise marks and overall average percentage.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_assignments",
        description:
          "Get the student's assignments/homework list including due dates, submission status, and grades if already graded.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_exams",
        description:
          "Get the student's exam schedule (published exams for their class), including dates, subjects covered, and total marks.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_fees",
        description:
          "Get the student's pending/outstanding fee details including fee type, amount due, and due dates.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_announcements",
        description: "Get recent school announcements relevant to the student.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Executor — runs the actual server action for a given tool name
// All underlying actions already enforce auth() + STUDENT role checks,
// so no additional authorization needed here.
// ─────────────────────────────────────────────────────────────

export async function executeStudentTool(name: string): Promise<unknown> {
  switch (name) {
    case "get_overview": {
      const stats = await getStudentStats();
      if (!stats) return { error: "Could not load overview" };
      return {
        attendancePercentage: stats.attendancePercentage,
        todayClasses: stats.todayClasses,
        pendingAssignmentsCount: stats.pendingAssignments.length,
        totalOutstandingFees: stats.totalOutstandingFees,
        upcomingExamsCount: stats.upcomingExams.length,
      };
    }

    case "get_grades": {
      const data = await getStudentGrades();
      if (!data) return { error: "Could not load grades" };
      return data;
    }

    case "get_assignments": {
      const data = await getAssignments({ page: 1, pageSize: 20 });
      if (!data) return { error: "Could not load assignments" };
      return data.assignments;
    }

    case "get_exams": {
      const data = await getStudentExams();
      if (!data) return { error: "Could not load exams" };
      return data.exams;
    }

    case "get_fees": {
      const stats = await getStudentStats();
      if (!stats) return { error: "Could not load fees" };
      return {
        pendingFees: stats.pendingFees,
        totalOutstanding: stats.totalOutstandingFees,
      };
    }

    case "get_announcements": {
      const stats = await getStudentStats();
      if (!stats) return { error: "Could not load announcements" };
      return stats.recentAnnouncements;
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
