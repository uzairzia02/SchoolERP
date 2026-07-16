import { PrismaClient } from "@prisma/client";

interface Context {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedAcademicYear({
  prisma,
  schoolId,
}: Context) {
  console.log("\n📚 Seeding Academic Year...");

  const academicYear = await prisma.academicYear.upsert({
    where: {
      id: "demo-academic-year",
    },
    update: {},
    create: {
      id: "demo-academic-year",
      schoolId,
      name: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
    },
  });

  console.log(
    `✅ Academic Year Created: ${academicYear.name}`
  );

  return academicYear;
}