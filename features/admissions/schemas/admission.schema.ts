import { z } from "zod";

export const admissionSchema = z.object({
  // Personal Info
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Gender is required",
  }),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),

  // Applying For
  applyingForClass: z.string().min(1, "Class is required"),

  // Parent Info
  parentFirstName: z.string().min(1, "Parent first name is required"),
  parentLastName: z.string().min(1, "Parent last name is required"),
  parentEmail: z.string().email("Valid email required"),
  parentPhone: z.string().min(1, "Parent phone is required"),
  parentRelation: z.string().min(1, "Relation is required"),
  parentOccupation: z.string().optional(),

  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),

  // Previous School
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  previousGrade: z.string().optional(),

  remarks: z.string().optional(),
});

export const enrollStudentSchema = z.object({
  admissionId: z.string().min(1),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),

  // Fee Setup
  feeSetup: z.array(
    z.object({
      feeTypeId: z.string().min(1),
      amount: z.coerce.number().min(0),
      dueDate: z.string().min(1),
      isMonthly: z.boolean().default(false),
      monthsCount: z.coerce.number().int().min(1).max(12).default(1),
      discount: z.coerce.number().min(0).default(0),
    })
  ).optional(),
});

export const updateAdmissionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]),
  remarks: z.string().optional(),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type UpdateAdmissionStatusInput = z.infer<typeof updateAdmissionStatusSchema>;