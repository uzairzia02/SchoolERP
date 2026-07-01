import { z } from "zod";

export const classSchema = z.object({
  name: z
    .string()
    .min(1, "Class name is required")
    .max(20, "Class name too long"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name too long"),
  order: z.coerce.number().int().min(0).default(0),
});

export const classUpdateSchema = classSchema.partial().extend({
  id: z.string().min(1),
});

export const sectionSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  name: z
    .string()
    .min(1, "Section name is required")
    .max(10, "Section name too long"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").default(40),
});

export const sectionUpdateSchema = sectionSchema.partial().extend({
  id: z.string().min(1),
});

export type ClassInput = z.infer<typeof classSchema>;
export type ClassUpdateInput = z.infer<typeof classUpdateSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;