import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().min(1, "Subject code is required").max(20).toUpperCase(),
  description: z.string().optional(),
  creditHours: z.coerce.number().int().min(1).max(10).default(1),
  classId: z.string().optional(),
});

export const subjectUpdateSchema = subjectSchema.partial().extend({
  id: z.string().min(1),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>;