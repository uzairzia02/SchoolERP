import { z } from "zod";

export const feeTypeSchema = z.object({
  name: z.string().min(1, "Fee type name is required").max(100),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  isRecurring: z.boolean().default(false),
});

export const feeTypeUpdateSchema = feeTypeSchema.partial().extend({
  id: z.string().min(1),
});

export const assignFeeSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
  feeTypeId: z.string().min(1, "Fee type is required"),
  amount: z.coerce.number().min(0),
  dueDate: z.string().min(1, "Due date is required"),
  discount: z.coerce.number().min(0).default(0),
  remarks: z.string().optional(),
});

export const collectFeeSchema = z.object({
  feeId: z.string().min(1),
  paidAmount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"]),
  remarks: z.string().optional(),
});

export type FeeTypeInput = z.infer<typeof feeTypeSchema>;
export type FeeTypeUpdateInput = z.infer<typeof feeTypeUpdateSchema>;
export type AssignFeeInput = z.infer<typeof assignFeeSchema>;
export type CollectFeeInput = z.infer<typeof collectFeeSchema>;