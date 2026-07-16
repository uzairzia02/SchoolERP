import { PrismaClient } from "@prisma/client";

export async function generateStudentId(
  prisma: PrismaClient,
  schoolId: string
) {
  const school = await prisma.school.update({
    where: { id: schoolId },
    data: {
      studentSequence: {
        increment: 1,
      },
    },
    select: {
      studentSequence: true,
    },
  });

  return `STD-${school.studentSequence.toString().padStart(6, "0")}`;
}

export async function generateTeacherId(
  prisma: PrismaClient,
  schoolId: string
) {
  const school = await prisma.school.update({
    where: { id: schoolId },
    data: {
      teacherSequence: {
        increment: 1,
      },
    },
    select: {
      teacherSequence: true,
    },
  });

  return `TCH-${school.teacherSequence.toString().padStart(6, "0")}`;
}

export async function generateEmployeeId(
  prisma: PrismaClient,
  schoolId: string
) {
  const school = await prisma.school.update({
    where: { id: schoolId },
    data: {
      employeeSequence: {
        increment: 1,
      },
    },
    select: {
      employeeSequence: true,
    },
  });

  return `EMP-${school.employeeSequence.toString().padStart(6, "0")}`;
}