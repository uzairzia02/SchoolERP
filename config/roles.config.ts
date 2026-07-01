import { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Permission Keys — every feature action in the system
// ─────────────────────────────────────────────────────────────

export type Permission =
  // Students
  | "students:view"
  | "students:create"
  | "students:edit"
  | "students:delete"
  // Teachers
  | "teachers:view"
  | "teachers:create"
  | "teachers:edit"
  | "teachers:delete"
  // Employees
  | "employees:view"
  | "employees:create"
  | "employees:edit"
  | "employees:delete"
  // Parents
  | "parents:view"
  | "parents:create"
  | "parents:edit"
  | "parents:delete"
  // Attendance
  | "attendance:view"
  | "attendance:mark"
  | "attendance:edit"
  | "attendance:export"
  // Exams & Grades
  | "exams:view"
  | "exams:create"
  | "exams:edit"
  | "exams:delete"
  | "grades:view"
  | "grades:enter"
  | "grades:edit"
  | "grades:publish"
  // Fees
  | "fees:view"
  | "fees:create"
  | "fees:collect"
  | "fees:edit"
  | "fees:delete"
  // Payroll
  | "payroll:view"
  | "payroll:create"
  | "payroll:process"
  // Leaves
  | "leaves:view"
  | "leaves:apply"
  | "leaves:approve"
  // Timetable
  | "timetable:view"
  | "timetable:create"
  | "timetable:edit"
  // Assignments
  | "assignments:view"
  | "assignments:create"
  | "assignments:edit"
  | "assignments:submit"
  // Admissions
  | "admissions:view"
  | "admissions:create"
  | "admissions:review"
  | "admissions:decide"
  // Reports
  | "reports:view"
  | "reports:export"
  // Settings
  | "settings:view"
  | "settings:edit"
  // Audit
  | "audit:view"
  // HR
  | "hr:view"
  | "hr:manage"
  // Departments
  | "departments:view"
  | "departments:manage"
  // Announcements
  | "announcements:view"
  | "announcements:create"
  | "announcements:manage"
  // Transport
  | "transport:view"
  | "transport:manage"
  // Gallery / Events / News
  | "gallery:view"
  | "gallery:manage"
  | "events:view"
  | "events:manage"
  | "news:view"
  | "news:manage";

// ─────────────────────────────────────────────────────────────
// Role → Permission Map
// ─────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "students:view", "students:create", "students:edit", "students:delete",
    "teachers:view", "teachers:create", "teachers:edit", "teachers:delete",
    "employees:view", "employees:create", "employees:edit", "employees:delete",
    "parents:view", "parents:create", "parents:edit", "parents:delete",
    "attendance:view", "attendance:mark", "attendance:edit", "attendance:export",
    "exams:view", "exams:create", "exams:edit", "exams:delete",
    "grades:view", "grades:enter", "grades:edit", "grades:publish",
    "fees:view", "fees:create", "fees:collect", "fees:edit", "fees:delete",
    "payroll:view", "payroll:create", "payroll:process",
    "leaves:view", "leaves:apply", "leaves:approve",
    "timetable:view", "timetable:create", "timetable:edit",
    "assignments:view", "assignments:create", "assignments:edit",
    "admissions:view", "admissions:create", "admissions:review", "admissions:decide",
    "reports:view", "reports:export",
    "settings:view", "settings:edit",
    "audit:view",
    "hr:view", "hr:manage",
    "departments:view", "departments:manage",
    "announcements:view", "announcements:create", "announcements:manage",
    "transport:view", "transport:manage",
    "gallery:view", "gallery:manage",
    "events:view", "events:manage",
    "news:view", "news:manage",
  ],

  PRINCIPAL: [
    "students:view", "students:create", "students:edit",
    "teachers:view", "teachers:create", "teachers:edit",
    "employees:view",
    "parents:view",
    "attendance:view", "attendance:mark", "attendance:export",
    "exams:view", "exams:create", "exams:edit",
    "grades:view", "grades:enter", "grades:edit", "grades:publish",
    "fees:view",
    "payroll:view",
    "leaves:view", "leaves:approve",
    "timetable:view", "timetable:create", "timetable:edit",
    "assignments:view",
    "admissions:view", "admissions:review", "admissions:decide",
    "reports:view", "reports:export",
    "settings:view",
    "audit:view",
    "hr:view",
    "departments:view",
    "announcements:view", "announcements:create", "announcements:manage",
    "transport:view",
    "gallery:view", "gallery:manage",
    "events:view", "events:manage",
    "news:view", "news:manage",
  ],

  HR: [
    "employees:view", "employees:create", "employees:edit",
    "teachers:view", "teachers:create", "teachers:edit",
    "parents:view",
    "leaves:view", "leaves:approve",
    "payroll:view", "payroll:create", "payroll:process",
    "attendance:view", "attendance:mark", "attendance:export",
    "departments:view", "departments:manage",
    "reports:view", "reports:export",
    "hr:view", "hr:manage",
    "announcements:view",
  ],

  ACCOUNTANT: [
    "fees:view", "fees:create", "fees:collect", "fees:edit",
    "payroll:view", "payroll:process",
    "students:view",
    "reports:view", "reports:export",
    "announcements:view",
  ],

  TEACHER: [
    "students:view",
    "attendance:view", "attendance:mark",
    "exams:view", "exams:create",
    "grades:view", "grades:enter",
    "timetable:view",
    "assignments:view", "assignments:create", "assignments:edit",
    "leaves:apply",
    "announcements:view",
    "events:view",
  ],

  FACULTY: [
    "students:view",
    "attendance:view", "attendance:mark",
    "exams:view",
    "grades:view", "grades:enter",
    "timetable:view",
    "assignments:view", "assignments:create",
    "leaves:apply",
    "announcements:view",
    "events:view",
  ],

  STUDENT: [
    "attendance:view",
    "grades:view",
    "timetable:view",
    "assignments:view", "assignments:submit",
    "fees:view",
    "announcements:view",
    "events:view",
    "news:view",
    "gallery:view",
  ],

  PARENT: [
    "attendance:view",
    "grades:view",
    "timetable:view",
    "assignments:view",
    "fees:view",
    "announcements:view",
    "events:view",
    "news:view",
  ],
};

// ─────────────────────────────────────────────────────────────
// Permission Check Utility
// ─────────────────────────────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export { ROLE_PERMISSIONS };