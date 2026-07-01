import { z } from "zod";

export const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Gender is required",
  }),
  address: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.coerce.number().int().min(0).optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  subjectIds: z.array(z.string()).optional(),
});

export const teacherUpdateSchema = teacherSchema.partial().extend({
  id: z.string().min(1),
});

export const teacherStatusSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
  lastWorkingDate: z.string().optional(),
  leavingReason: z.string().optional(),
});

export type TeacherStatusInput = z.infer<typeof teacherStatusSchema>;
export type TeacherInput = z.infer<typeof teacherSchema>;
export type TeacherUpdateInput = z.infer<typeof teacherUpdateSchema>;