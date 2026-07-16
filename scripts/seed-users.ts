import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

interface CreateUserInput {
  prisma: PrismaClient;
  schoolId: string;

  email: string;
  role: UserRole;
}

export async function createUser({
  prisma,
  schoolId,
  email,
  role,
}: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) return existing;

  const password = await bcrypt.hash("Password@123", 10);

  return prisma.user.create({
    data: {
      schoolId,
      email,
      password,
      role,
      isActive: true,
    },
  });
}