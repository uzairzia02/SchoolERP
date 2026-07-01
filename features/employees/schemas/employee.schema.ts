import { z } from "zod";

export const employeeSchema = z.object({
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
  salary: z.coerce.number().min(0).optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
});

export const employeeUpdateSchema = employeeSchema.partial().extend({
  id: z.string().min(1),
});

export const employeeStatusSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
  lastWorkingDate: z.string().optional(),
  leavingReason: z.string().optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type EmployeeStatusInput = z.infer<typeof employeeStatusSchema>;