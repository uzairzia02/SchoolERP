import { z } from "zod";

const PHONE_REGEX = /^03\d{2}-?\d{7}$/;

// Base object kept separate so studentUpdateSchema can still use .partial()
// (superRefine below returns a ZodEffects, which doesn't support .partial())
const baseStudentSchema = z.object({
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
    message: "Gender is required",
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
  // Auto-generated server-side on create (STU-0001, STU-0002...) — no longer
  // collected from the form. Kept optional here so the update schema (which
  // reads it read-only) doesn't break; createStudentAction ignores this field.
  admissionNumber: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  // Parent info
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z
    .string()
    .regex(PHONE_REGEX, "Phone must be in the format 03xx-xxxxxxx")
    .optional()
    .or(z.literal("")),
  parentRelation: z.string().optional(),
});

export const studentSchema = baseStudentSchema.superRefine((data, ctx) => {
  // If any parent info is being entered, phone becomes mandatory —
  // it's the field we use to detect/link existing parents.
  if (data.parentFirstName && !data.parentPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentPhone"],
      message: "Phone number is required when adding a parent",
    });
  }
});

export const studentUpdateSchema = baseStudentSchema.partial().extend({
  id: z.string().min(1),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;