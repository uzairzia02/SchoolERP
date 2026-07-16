import { PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedSchoolSettings({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n⚙️ Seeding School Settings...");

  await prisma.schoolSettings.upsert({
    where: {
      schoolId,
    },
    update: {
      currentSession: "2026-2027",
      termsCount: 3,
      passingMarks: 33,
    },
    create: {
      schoolId,

      currentSession: "2026-2027",
      sessionStartDate: new Date("2026-04-01"),
      sessionEndDate: new Date("2027-03-31"),

      termsCount: 3,
      passingMarks: 33,

      timezone: "Asia/Karachi",
      currency: "PKR",
      dateFormat: "DD/MM/YYYY",

      bankName: "Demo Bank",
      bankAccountNumber: "000111222333",
      bankBranch: "Main Branch",
    },
  });

  console.log("⚙️ School Settings Seed Completed");
}