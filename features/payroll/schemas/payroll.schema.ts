import { z } from "zod";

export const processPayrollSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  basicSalary: z.coerce.number().min(0, "Salary must be positive"),
  allowances: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"]),
  remarks: z.string().optional(),
});

export const bulkPayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"]),
  employeeIds: z.array(z.string()).min(1, "Select at least one employee"),
});

export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>;
export type BulkPayrollInput = z.infer<typeof bulkPayrollSchema>;