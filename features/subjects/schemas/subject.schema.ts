import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),

  code: z
    .string()
    .min(1, "Subject code is required")
    .max(20)
    .toUpperCase(),

  description: z.string().optional(),

  creditHours: z
    .number()
    .int()
    .min(1)
    .max(10),
});

export const subjectUpdateSchema = subjectSchema.partial().extend({
  id: z.string().min(1),
});

export type SubjectInput = z.input<typeof subjectSchema>;
export type SubjectUpdateInput = z.input<typeof subjectUpdateSchema>;