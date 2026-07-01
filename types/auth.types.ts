import { z } from "zod";
import { loginSchema, changePasswordSchema } from "@/lib/validations/auth.schema";

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;