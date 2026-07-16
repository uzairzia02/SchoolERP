import { PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedPeriods({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n📚 Seeding Periods...");

  const periods = [
    {
      name: "Period 1",
      periodNo: 1,
      startTime: "08:00",
      endTime: "08:45",
      duration: 45,
      isBreak: false,
    },
    {
      name: "Period 2",
      periodNo: 2,
      startTime: "08:45",
      endTime: "09:30",
      duration: 45,
      isBreak: false,
    },
    {
      name: "Period 3",
      periodNo: 3,
      startTime: "09:30",
      endTime: "10:15",
      duration: 45,
      isBreak: false,
    },
    {
      name: "Break",
      periodNo: 4,
      startTime: "10:15",
      endTime: "10:45",
      duration: 30,
      isBreak: true,
    },
    {
      name: "Period 5",
      periodNo: 5,
      startTime: "10:45",
      endTime: "11:30",
      duration: 45,
      isBreak: false,
    },
    {
      name: "Period 6",
      periodNo: 6,
      startTime: "11:30",
      endTime: "12:15",
      duration: 45,
      isBreak: false,
    },
    {
      name: "Period 7",
      periodNo: 7,
      startTime: "12:15",
      endTime: "13:00",
      duration: 45,
      isBreak: false,
    },
  ];

  for (const period of periods) {
    await prisma.period.upsert({
      where: {
        schoolId_periodNo: {
          schoolId,
          periodNo: period.periodNo,
        },
      },
      update: period,
      create: {
        schoolId,
        ...period,
      },
    });

    console.log(`✅ ${period.name}`);
  }

  console.log("📚 Period Seed Completed");
}