import { z } from "zod";

export const createAssignmentSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date({ required_error: "Due date is required" }),
  totalMarks: z.coerce.number().int().positive().optional(),
  attachments: z.array(z.string().url("Must be a valid URL")).default([]),
});

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  content: z.string().max(5000).optional(),
  attachments: z.array(z.string().url("Must be a valid URL")).default([]),
}).refine((data) => data.content || data.attachments.length > 0, {
  message: "Provide either text content or at least one attachment",
  path: ["content"],
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  marksObt: z.coerce.number().min(0, "Marks cannot be negative"),
  feedback: z.string().max(1000).optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
