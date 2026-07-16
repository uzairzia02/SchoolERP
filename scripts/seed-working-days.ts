import { DayOfWeek, PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedWorkingDays({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n📅 Seeding Working Days...");

  const workingDays = [
    {
      day: DayOfWeek.MONDAY,
      isWorking: true,
      startTime: "08:00",
      endTime: "14:00",
    },
    {
      day: DayOfWeek.TUESDAY,
      isWorking: true,
      startTime: "08:00",
      endTime: "14:00",
    },
    {
      day: DayOfWeek.WEDNESDAY,
      isWorking: true,
      startTime: "08:00",
      endTime: "14:00",
    },
    {
      day: DayOfWeek.THURSDAY,
      isWorking: true,
      startTime: "08:00",
      endTime: "14:00",
    },
    {
      day: DayOfWeek.FRIDAY,
      isWorking: true,
      startTime: "08:00",
      endTime: "12:30",
      description: "Friday shorter schedule",
    },
    {
      day: DayOfWeek.SATURDAY,
      isWorking: true,
      startTime: "08:00",
      endTime: "14:00",
    },
    {
      day: DayOfWeek.SUNDAY,
      isWorking: false,
      description: "Weekly Off",
    },
  ];

  for (const item of workingDays) {
    await prisma.workingDay.upsert({
      where: {
        schoolId_day: {
          schoolId,
          day: item.day,
        },
      },
      update: {
        isWorking: item.isWorking,
        startTime: item.startTime,
        endTime: item.endTime,
        description: item.description,
      },
      create: {
        schoolId,
        ...item,
      },
    });

    console.log(`✅ ${item.day}`);
  }

  console.log("📅 Working Days Seed Completed");
}