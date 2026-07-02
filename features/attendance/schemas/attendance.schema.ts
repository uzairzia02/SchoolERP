import { z } from "zod";

export const markAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]),
      remarks: z.string().optional(),
    })
  ),
});

export const markStaffAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  records: z.array(
    z.object({
      staffId: z.string().min(1),
      staffType: z.enum(["TEACHER", "EMPLOYEE"]),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]),
      remarks: z.string().optional(),
    })
  ),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type MarkStaffAttendanceInput = z.infer<typeof markStaffAttendanceSchema>;