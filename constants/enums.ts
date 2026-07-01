import { UserRole, Gender, AttendanceStatus, LeaveStatus, FeeStatus, ExamType, AdmissionStatus } from "@prisma/client";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PRINCIPAL: "Principal",
  HR: "HR Manager",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  FACULTY: "Faculty",
  STUDENT: "Student",
  PARENT: "Parent",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "On Leave",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  WAIVED: "Waived",
  OVERDUE: "Overdue",
};

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
};