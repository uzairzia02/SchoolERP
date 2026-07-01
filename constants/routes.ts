import { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Public Routes (no auth required)
// ─────────────────────────────────────────────────────────────

export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/admissions",
  "/facilities",
  "/curriculum",
  "/faculty",
  "/gallery",
  "/news",
  "/events",
  "/careers",
  "/contact",
  "/faq",
  "/login",
] as const;

// ─────────────────────────────────────────────────────────────
// Dashboard Routes per Role
// ─────────────────────────────────────────────────────────────

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  PRINCIPAL: "/dashboard/principal",
  HR: "/dashboard/hr",
  ACCOUNTANT: "/dashboard/accountant",
  TEACHER: "/dashboard/teacher",
  FACULTY: "/dashboard/faculty",
  STUDENT: "/dashboard/student",
  PARENT: "/dashboard/parent",
};

// ─────────────────────────────────────────────────────────────
// App Routes
// ─────────────────────────────────────────────────────────────

export const ROUTES = {
  // Auth
  auth: {
    login: "/login",
  },

  // Students
  students: {
    list: "/dashboard/students",
    create: "/dashboard/students/new",
    detail: (id: string) => `/dashboard/students/${id}`,
    edit: (id: string) => `/dashboard/students/${id}/edit`,
  },

  // Teachers
  teachers: {
    list: "/dashboard/teachers",
    create: "/dashboard/teachers/new",
    detail: (id: string) => `/dashboard/teachers/${id}`,
    edit: (id: string) => `/dashboard/teachers/${id}/edit`,
  },

  // Employees
  employees: {
    list: "/dashboard/employees",
    create: "/dashboard/employees/new",
    detail: (id: string) => `/dashboard/employees/${id}`,
    edit: (id: string) => `/dashboard/employees/${id}/edit`,
  },

  // Classes
  classes: {
    list: "/dashboard/classes",
    create: "/dashboard/classes/new",
    detail: (id: string) => `/dashboard/classes/${id}`,
  },

  // Attendance
  attendance: {
    students: "/dashboard/attendance/students",
    staff: "/dashboard/attendance/staff",
    reports: "/dashboard/attendance/reports",
  },

  // Exams
  exams: {
    list: "/dashboard/exams",
    create: "/dashboard/exams/new",
    detail: (id: string) => `/dashboard/exams/${id}`,
    grades: (id: string) => `/dashboard/exams/${id}/grades`,
  },

  // Fees
  fees: {
    list: "/dashboard/fees",
    collect: "/dashboard/fees/collect",
    reports: "/dashboard/fees/reports",
  },

  // Payroll
  payroll: {
    list: "/dashboard/payroll",
    process: "/dashboard/payroll/process",
  },

  // Leaves
  leaves: {
    list: "/dashboard/leaves",
    apply: "/dashboard/leaves/apply",
  },

  // Timetable
  timetable: {
    list: "/dashboard/timetable",
    create: "/dashboard/timetable/new",
  },

  // Assignments
  assignments: {
    list: "/dashboard/assignments",
    create: "/dashboard/assignments/new",
    detail: (id: string) => `/dashboard/assignments/${id}`,
  },

  // Reports
  reports: {
    attendance: "/dashboard/reports/attendance",
    students: "/dashboard/reports/students",
    fees: "/dashboard/reports/fees",
    payroll: "/dashboard/reports/payroll",
    results: "/dashboard/reports/results",
  },

  // Settings
  settings: {
    general: "/dashboard/settings",
    school: "/dashboard/settings/school",
    users: "/dashboard/settings/users",
    roles: "/dashboard/settings/roles",
  },

  // Audit
  audit: "/dashboard/audit",

  // Profile
  profile: "/dashboard/profile",
} as const;