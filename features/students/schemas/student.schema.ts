import { z } from "zod";

export const studentSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Gender is required",
  }),
  bloodGroup: z
    .enum([
      "A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE",
      "AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE",
    ])
    .optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
  admissionNumber: z.string().min(1, "Admission number is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  // Parent info
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  parentRelation: z.string().optional(),
});

export const studentUpdateSchema = studentSchema.partial().extend({
  id: z.string().min(1),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;