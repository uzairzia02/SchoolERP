import type { UserRole } from "@prisma/client";
import type { NavGroup } from "@/types/globals.types";

export const NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  SUPER_ADMIN: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/super-admin", icon: "LayoutDashboard" },
        { title: "Audit Logs", href: "/dashboard/audit", icon: "Shield" },
      ],
    },
    {
      title: "Academic",
      items: [
        { title: "Students", href: "/dashboard/students", icon: "GraduationCap" },
        { title: "Teachers", href: "/dashboard/teachers", icon: "Users" },
        { title: "Classes", href: "/dashboard/classes", icon: "BookOpen" },
        { title: "Subjects", href: "/dashboard/subjects", icon: "Book" },
        { title: "Timetable", href: "/dashboard/timetable", icon: "Calendar" },
        { title: "Attendance", href: "/dashboard/attendance/students", icon: "ClipboardCheck" },
        { title: "Examinations", href: "/dashboard/exams", icon: "FileText" },
        { title: "Assignments", href: "/dashboard/assignments", icon: "ClipboardList" },
      ],
    },
    {
      title: "Administration",
      items: [
        { title: "Employees", href: "/dashboard/employees", icon: "Briefcase" },
        { title: "Departments", href: "/dashboard/departments", icon: "Building2" },
        { title: "Admissions", href: "/dashboard/admissions", icon: "UserPlus" },
        { title: "Parents", href: "/dashboard/parents", icon: "Users2" },
        { title: "Leaves", href: "/dashboard/leaves", icon: "CalendarOff" },
        { title: "Transport", href: "/dashboard/transport", icon: "Bus" },
      ],
    },
    {
      title: "Finance",
      items: [
        { title: "Fee Management", href: "/dashboard/fees", icon: "CreditCard" },
        { title: "Payroll", href: "/dashboard/payroll", icon: "Banknote" },
      ],
    },
    {
      title: "Communication",
      items: [
        { title: "Announcements", href: "/dashboard/announcements", icon: "Megaphone" },
        { title: "Events", href: "/dashboard/events", icon: "CalendarDays" },
        { title: "News", href: "/dashboard/news", icon: "Newspaper" },
        { title: "Gallery", href: "/dashboard/gallery", icon: "Image" },
      ],
    },
    {
      title: "System",
      items: [
        { title: "Reports", href: "/dashboard/reports", icon: "BarChart3" },
        { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
      ],
    },
  ],

  PRINCIPAL: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/principal", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Academic",
      items: [
        { title: "Students", href: "/dashboard/students", icon: "GraduationCap" },
        { title: "Teachers", href: "/dashboard/teachers", icon: "Users" },
        { title: "Classes", href: "/dashboard/classes", icon: "BookOpen" },
        { title: "Timetable", href: "/dashboard/timetable", icon: "Calendar" },
        { title: "Attendance", href: "/dashboard/attendance/students", icon: "ClipboardCheck" },
        { title: "Examinations", href: "/dashboard/exams", icon: "FileText" },
        { title: "Admissions", href: "/dashboard/admissions", icon: "UserPlus" },
      ],
    },
    {
      title: "Administration",
      items: [
        { title: "Leaves", href: "/dashboard/leaves", icon: "CalendarOff" },
        { title: "Announcements", href: "/dashboard/announcements", icon: "Megaphone" },
        { title: "Events", href: "/dashboard/events", icon: "CalendarDays" },
        { title: "Reports", href: "/dashboard/reports", icon: "BarChart3" },
      ],
    },
  ],

  HR: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/hr", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "HR Management",
      items: [
        { title: "Employees", href: "/dashboard/employees", icon: "Briefcase" },
        { title: "Teachers", href: "/dashboard/teachers", icon: "Users" },
        { title: "Departments", href: "/dashboard/departments", icon: "Building2" },
        { title: "Designations", href: "/dashboard/designations", icon: "Tag" },
        { title: "Attendance", href: "/dashboard/attendance/staff", icon: "ClipboardCheck" },
        { title: "Leaves", href: "/dashboard/leaves", icon: "CalendarOff" },
        { title: "Payroll", href: "/dashboard/payroll", icon: "Banknote" },
        { title: "Reports", href: "/dashboard/reports", icon: "BarChart3" },
      ],
    },
  ],

  ACCOUNTANT: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/accountant", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Finance",
      items: [
        { title: "Fee Management", href: "/dashboard/fees", icon: "CreditCard" },
        { title: "Payroll", href: "/dashboard/payroll", icon: "Banknote" },
        { title: "Students", href: "/dashboard/students", icon: "GraduationCap" },
        { title: "Reports", href: "/dashboard/reports", icon: "BarChart3" },
      ],
    },
  ],

  TEACHER: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/teacher", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Academic",
      items: [
        { title: "My Classes", href: "/dashboard/classes", icon: "BookOpen" },
        { title: "Timetable", href: "/dashboard/timetable", icon: "Calendar" },
        { title: "Attendance", href: "/dashboard/attendance/students", icon: "ClipboardCheck" },
        { title: "Assignments", href: "/dashboard/assignments", icon: "ClipboardList" },
        { title: "Examinations", href: "/dashboard/exams", icon: "FileText" },
        { title: "Grades", href: "/dashboard/grades", icon: "Star" },
        { title: "Leaves", href: "/dashboard/leaves", icon: "CalendarOff" },
      ],
    },
  ],

  FACULTY: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/faculty", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Academic",
      items: [
        { title: "Timetable", href: "/dashboard/timetable", icon: "Calendar" },
        { title: "Attendance", href: "/dashboard/attendance/students", icon: "ClipboardCheck" },
        { title: "Assignments", href: "/dashboard/assignments", icon: "ClipboardList" },
        { title: "Leaves", href: "/dashboard/leaves", icon: "CalendarOff" },
      ],
    },
  ],

  STUDENT: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard/student", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "My Portal",
      items: [
        { title: "Attendance", href: "/dashboard/attendance/students", icon: "ClipboardCheck" },
        { title: "Timetable", href: "/dashboard/timetable", icon: "Calendar" },
        { title: "Assignments", href: "/dashboard/student/assignments", icon: "ClipboardList" },
        { title: "Examinations", href: "/dashboard/student/exams", icon: "FileText" },
        { title: "Results", href: "/dashboard/student/grades", icon: "Star" },
        { title: "Fee Status", href: "/dashboard/student/fees", icon: "CreditCard" },
        { title: "Announcements", href: "/dashboard/announcements", icon: "Megaphone" },
      ],
    },
  ],

  PARENT: [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard/parent", icon: "LayoutDashboard" },
    ],
  },
  {
    title: "My Family",
    items: [
      { title: "My Children", href: "/dashboard/parent/children", icon: "Users" },
      { title: "Assignments", href: "/dashboard/parent/assignments", icon: "ClipboardList" },
      { title: "Announcements", href: "/dashboard/announcements", icon: "Megaphone" },
    ],
  },
],
};