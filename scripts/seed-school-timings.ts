import { PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedSchoolTimings({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n⏰ Seeding School Timings...");

  await prisma.schoolTiming.upsert({
    where: {
      id: "demo-school-timing",
    },
    update: {},
    create: {
      id: "demo-school-timing",
      schoolId,

      name: "Regular Morning Shift",

      startTime: "08:00",
      endTime: "14:00",

      breakStart: "11:30",
      breakEnd: "12:00",

      isDefault: true,
      isActive: true,
    },
  });

  console.log("✅ Regular Morning Shift Created");

  console.log("⏰ School Timings Seed Completed");
}