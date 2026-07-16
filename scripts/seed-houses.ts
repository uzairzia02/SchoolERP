import { PrismaClient } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedHouses({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n🏠 Seeding Houses...");

  const houses = [
    {
      name: "Quaid House",
      color: "Green",
    },
    {
      name: "Iqbal House",
      color: "Blue",
    },
    {
      name: "Jinnah House",
      color: "Red",
    },
    {
      name: "Fatima House",
      color: "Yellow",
    },
  ];

  for (const house of houses) {
    await prisma.house.upsert({
      where: {
        id: `${schoolId}-${house.name}`,
      },
      update: {
        color: house.color,
      },
      create: {
        id: `${schoolId}-${house.name}`,
        schoolId,
        ...house,
      },
    });

    console.log(`✅ ${house.name}`);
  }

  console.log("🏠 Houses Seed Completed");
}