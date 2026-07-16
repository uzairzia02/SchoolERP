import { PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedHolidays({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n🎉 Seeding Holidays...");

  const holidays = [
    {
      name: "Pakistan Day",
      date: new Date("2026-03-23"),
      description: "National Holiday",
    },
    {
      name: "Eid ul Fitr",
      date: new Date("2026-03-21"),
      description: "Religious Holiday",
    },
    {
      name: "Independence Day",
      date: new Date("2026-08-14"),
      description: "Pakistan Independence Day",
    },
    {
      name: "Quaid-e-Azam Day",
      date: new Date("2026-12-25"),
      description: "Birthday of Quaid-e-Azam",
    },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.create({
      data: {
        schoolId,
        ...holiday,
      },
    });

    console.log(`✅ ${holiday.name}`);
  }

  console.log("🎉 Holidays Seed Completed");
}