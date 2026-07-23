import { Type } from "@google/genai";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getSuperAdminStats,
  getMonthlyEnrollment,
  getMonthlyFeeCollection,
} from "@/features/dashboard/super-admin/actions/stats.actions";
import { getStudents, getStudentById } from "@/features/students/actions/student.actions";
import { getTeachers, getTeacherById } from "@/features/teachers/actions/teacher.actions";
import { getStudentFees, getFeeSummary } from "@/features/fees/actions/fee.actions";
import { getAdmissions, getAdmissionSummary } from "@/features/admissions/actions/admission.actions";
import { getPendingPaymentSubmissions } from "@/features/fees/actions/verify-payment.actions";

async function getAdminSchoolId() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user.schoolId;
}

// ─────────────────────────────────────────────────────────────
// Tool declarations
// ─────────────────────────────────────────────────────────────

export const superAdminTools = [
  {
    functionDeclarations: [
      {
        name: "get_school_overview",
        description: "Get school-wide dashboard overview: total students/teachers/employees, attendance rate, pending leaves, pending admissions, collected fees, unpaid fees, recent students, upcoming events.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_enrollment_trend",
        description: "Get month-by-month new student enrollment counts for the current year.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_fee_collection_trend",
        description: "Get month-by-month fee collection totals for the current year.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "search_students",
        description: "Search students by name or admission number. Returns matching students with class, section, and contact info.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Name or admission number to search for." },
          },
          required: ["query"],
        },
      },
      // 🔥 NEW: Get students by class/section
      {
        name: "get_students_by_class",
        description: "Get count and list of students in a specific class and/or section. Use this when asked 'how many students in class X' or 'students in section Y'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            className: { type: Type.STRING, description: "Class name e.g. '1' or 'Class 1'." },
            sectionName: { type: Type.STRING, description: "Optional section name e.g. 'A' or 'Section A'." },
          },
          required: ["className"],
        },
      },
      {
        name: "get_student_fee_status",
        description: "Get the full fee record (amounts, due dates, paid status) for one specific student. Call search_students first if student id is unknown.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            studentQuery: {
              type: Type.STRING,
              description: "Student name or admission number to look up fees for.",
            },
          },
          required: ["studentQuery"],
        },
      },
      // 🔥 NEW: Get students who have paid fees
      {
        name: "get_paid_fee_students",
        description: "Get list of students who have paid their fees, with payment details. Use this when asked 'who has paid fees' or 'show me paid students'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: { type: Type.NUMBER, description: "Max number of records to return (default 20)." },
          },
        },
      },
      // 🔥 NEW: Get students with unpaid/overdue fees
      {
        name: "get_unpaid_fee_students",
        description: "Get list of students with unpaid or overdue fees. Use this when asked 'who hasn't paid fees' or 'show me pending fees'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: { type: Type.NUMBER, description: "Max number of records to return (default 20)." },
          },
        },
      },
      {
        name: "search_teachers",
        description: "Search teachers/faculty by name, email, or employee id. Returns matching teachers with department, designation, and join date.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Name, email, or employee id to search for." },
          },
          required: ["query"],
        },
      },
      {
        name: "get_fee_summary",
        description: "Get school-wide fee summary: total billed, collected, pending, discounts, and counts by status.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_pending_payment_verifications",
        description: "Get fee payments submitted by parents/students awaiting admin verification/approval.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "get_admissions_overview",
        description: "Get admissions funnel summary (applied, under review, accepted, enrolled, rejected counts).",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "search_admissions",
        description: "Search admission applications by applicant name, email, or phone, optionally filtered by status.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Applicant name, email, or phone." },
            status: { type: Type.STRING, description: "Optional: APPLIED, UNDER_REVIEW, ACCEPTED, ENROLLED, REJECTED." },
          },
          required: ["query"],
        },
      },
      {
        name: "get_pending_leaves",
        description: "Get all pending leave applications across the whole school with applicant name, type, and dates.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Executor
// ─────────────────────────────────────────────────────────────

export async function executeSuperAdminTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const schoolId = await getAdminSchoolId();
  if (!schoolId) return { error: "Could not resolve school for this account." };

  switch (name) {
    case "get_school_overview": {
      return await getSuperAdminStats();
    }

    case "get_enrollment_trend": {
      return await getMonthlyEnrollment();
    }

    case "get_fee_collection_trend": {
      return await getMonthlyFeeCollection();
    }

    case "search_students": {
      const query = String(args.query ?? "");
      const result = await getStudents({ page: 1, pageSize: 15, search: query });
      return result.data;
    }

    // 🔥 NEW: Get students by class/section
    // 🔥 FIXED: Get students by class/section
    // 🔥 FIXED: Get students by class/section
case "get_students_by_class": {
  const className = String(args.className ?? "").trim();
  const sectionName = String(args.sectionName ?? "").trim();

  const allClasses = await db.class.findMany({
    where: { schoolId, deletedAt: null },
    select: { id: true, name: true, displayName: true },
  });

  console.log("🔍 Searching for class:", className);
  console.log("📋 Available classes:", allClasses.map(c => `${c.name} (${c.displayName})`));

  // 🔥 EXACT match pehle
  let classRecord = allClasses.find((c) => {
    const cleanSearch = className.toLowerCase().replace(/class\s*/i, "").replace(/grade\s*/i, "").trim();
    const cleanName = (c.name || "").toLowerCase().replace(/class\s*/i, "").replace(/grade\s*/i, "").trim();
    const cleanDisplay = (c.displayName || "").toLowerCase().replace(/class\s*/i, "").replace(/grade\s*/i, "").trim();
    
    // Exact match
    return cleanName === cleanSearch || cleanDisplay === cleanSearch;
  });

  // Agar exact match nahi mila to contains try karo
  if (!classRecord) {
    classRecord = allClasses.find((c) => {
      const cleanSearch = className.toLowerCase().replace(/class\s*/i, "").replace(/grade\s*/i, "").trim();
      const cleanName = (c.name || "").toLowerCase().replace(/class\s*/i, "").replace(/grade\s*/i, "").trim();
      const cleanDisplay = (c.displayName || "").toLowerCase().replace(/class\s*/i, "").replace(/grade\s*/i, "").trim();
      
      return cleanName.includes(cleanSearch) || cleanDisplay.includes(cleanSearch);
    });
  }

  if (!classRecord) {
    return { 
      error: `Class "${className}" not found. Available classes: ${allClasses.map(c => c.displayName || c.name).join(", ")}` 
    };
  }

  console.log("✅ Matched class:", classRecord.displayName || classRecord.name);

  // Section filter
  let sectionId: string | undefined;
  let matchedSectionName: string | undefined;

  if (sectionName) {
    const cleanSectionName = sectionName.toLowerCase().replace(/section\s*/i, "").trim();
    
    const allSections = await db.section.findMany({
      where: { schoolId, classId: classRecord.id },
      select: { id: true, name: true },
    });

    console.log("🔍 Searching for section:", sectionName, "in class:", classRecord.displayName);
    console.log("📋 Available sections:", allSections.map(s => s.name));

    const section = allSections.find((s) => {
      const secName = (s.name || "").toLowerCase().replace(/section\s*/i, "").trim();
      return secName === cleanSectionName;
    });

    if (!section) {
      return { 
        error: `Section "${sectionName}" not found in class ${classRecord.displayName || classRecord.name}. Available sections: ${allSections.map(s => s.name).join(", ")}` 
      };
    }
    sectionId = section.id;
    matchedSectionName = section.name;
    console.log("✅ Matched section:", section.name);
  }

  // Students fetch
  const whereClause: any = { 
    schoolId, 
    classId: classRecord.id, 
    deletedAt: null, 
    isActive: true 
  };
  if (sectionId) whereClause.sectionId = sectionId;

  const students = await db.student.findMany({
    where: whereClause,
    select: {
      id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true,
      class: { select: { displayName: true } },
      section: { select: { name: true } },
    },
    orderBy: { firstName: "asc" },
  });

  return {
    total: students.length,
    class: classRecord.displayName || classRecord.name,
    section: matchedSectionName || "All Sections",
    students: students.map(s => ({
      name: `${s.firstName} ${s.lastName}`,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber,
      section: s.section?.name,
    })),
  };
}

    case "get_student_fee_status": {
      const query = String(args.studentQuery ?? "");
      const students = await getStudents({ page: 1, pageSize: 5, search: query });
      const match = students.data[0];
      if (!match) return { error: `No student found matching "${query}".` };

      const fees = await getStudentFees(match.id);
      return {
        student: `${match.firstName} ${match.lastName}`,
        admissionNumber: match.admissionNumber,
        class: match.class?.name,
        section: match.section?.name,
        fees,
      };
    }

    // 🔥 NEW: Paid fee students
    case "get_paid_fee_students": {
      const limit = Number(args.limit ?? 20);
      const paidFees = await db.fee.findMany({
        where: { schoolId, status: "PAID" },
        orderBy: { paidDate: "desc" },
        take: limit,
        select: {
          id: true, amount: true, paidAmount: true, paidDate: true, paymentMethod: true,
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNumber: true, class: { select: { displayName: true } } },
          },
          feeType: { select: { name: true } },
        },
      });

      return {
        total: paidFees.length,
        students: paidFees.map((f) => ({
          student: `${f.student?.firstName ?? ""} ${f.student?.lastName ?? ""}`.trim(),
          admissionNumber: f.student?.admissionNumber,
          class: f.student?.class?.displayName,
          feeType: f.feeType?.name,
          amount: Number(f.amount),
          paid: Number(f.paidAmount),
          paidDate: f.paidDate,
          method: f.paymentMethod,
        })),
      };
    }

    // 🔥 NEW: Unpaid fee students
    case "get_unpaid_fee_students": {
      const limit = Number(args.limit ?? 20);
      const unpaidFees = await db.fee.findMany({
        where: { schoolId, status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
        orderBy: { dueDate: "asc" },
        take: limit,
        select: {
          id: true, amount: true, paidAmount: true, dueDate: true, status: true,
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNumber: true, class: { select: { displayName: true } } },
          },
          feeType: { select: { name: true } },
        },
      });

      return {
        total: unpaidFees.length,
        students: unpaidFees.map((f) => ({
          student: `${f.student?.firstName ?? ""} ${f.student?.lastName ?? ""}`.trim(),
          admissionNumber: f.student?.admissionNumber,
          class: f.student?.class?.displayName,
          feeType: f.feeType?.name,
          amount: Number(f.amount),
          paid: Number(f.paidAmount),
          balance: Number(f.amount) - Number(f.paidAmount),
          dueDate: f.dueDate,
          status: f.status,
        })),
      };
    }

    case "search_teachers": {
      const query = String(args.query ?? "");
      const result = await getTeachers({ page: 1, pageSize: 15, search: query });
      return result.data;
    }

    case "get_fee_summary": {
      return await getFeeSummary();
    }

    case "get_pending_payment_verifications": {
      const result = await getPendingPaymentSubmissions();
      return result ?? { error: "Could not load pending payment verifications." };
    }

    case "get_admissions_overview": {
      return await getAdmissionSummary();
    }

    case "search_admissions": {
      const query = String(args.query ?? "");
      const status = args.status as
        | "APPLIED" | "UNDER_REVIEW" | "ACCEPTED" | "ENROLLED" | "REJECTED"
        | undefined;
      const result = await getAdmissions({ page: 1, pageSize: 15, search: query, status });
      return result.data;
    }

    case "get_pending_leaves": {
      const leaves = await db.leave.findMany({
        where: { schoolId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, type: true, startDate: true, endDate: true, totalDays: true,
          teacher: { select: { firstName: true, lastName: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
      });
      return leaves.map((l) => ({
        applicant: l.teacher
          ? `${l.teacher.firstName} ${l.teacher.lastName} (Teacher)`
          : l.employee
          ? `${l.employee.firstName} ${l.employee.lastName} (Staff)`
          : "Unknown",
        type: l.type,
        startDate: l.startDate,
        endDate: l.endDate,
        totalDays: l.totalDays,
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}