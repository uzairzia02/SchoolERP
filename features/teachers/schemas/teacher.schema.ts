import { z } from "zod";

export const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  // email is no longer collected from the form — auto-generated on create
  // (kept optional so teacherUpdateSchema.partial() doesn't break, and so
  // any leftover reference to it elsewhere in the codebase still compiles)
  email: z.string().email("Enter a valid email address").optional(),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Gender is required",
  }),
  address: z.string().optional(),
  // employeeId is auto-generated server-side (TEA-0001, TEA-0002...) —
  // no longer collected from the form.
  employeeId: z.string().optional(),
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