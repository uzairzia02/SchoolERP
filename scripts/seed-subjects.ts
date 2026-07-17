import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedSubjects(context?: {
  prisma: PrismaClient;
  schoolId: string;
}) {
  const db = context?.prisma ?? prisma;

  const schoolId =
    context?.schoolId ??
    (
      await db.school.findFirst({
        where: { code: "DEMO-SCHOOL" },
        select: { id: true },
      })
    )?.id;

  if (!schoolId) {
    throw new Error("Demo school not found.");
  }

  console.log("📚 Seeding Subjects...");

  const subjects = [
    {
      name: "English",
      code: "ENG",
      creditHours: 5,
      description: "English Language",
    },
    {
      name: "Urdu",
      code: "URD",
      creditHours: 5,
      description: "Urdu Language",
    },
    {
      name: "Mathematics",
      code: "MATH",
      creditHours: 6,
      description: "Mathematics",
    },
    {
      name: "General Science",
      code: "SCI",
      creditHours: 4,
      description: "General Science",
    },
    {
      name: "Physics",
      code: "PHY",
      creditHours: 5,
      description: "Physics",
    },
    {
      name: "Chemistry",
      code: "CHEM",
      creditHours: 5,
      description: "Chemistry",
    },
    {
      name: "Biology",
      code: "BIO",
      creditHours: 5,
      description: "Biology",
    },
    {
      name: "Computer Science",
      code: "COMP",
      creditHours: 4,
      description: "Computer Science",
    },
    {
      name: "Pakistan Studies",
      code: "PAK",
      creditHours: 3,
      description: "Pakistan Studies",
    },
    {
      name: "Islamiat",
      code: "ISL",
      creditHours: 3,
      description: "Islamic Studies",
    },
    {
      name: "Social Studies",
      code: "SST",
      creditHours: 3,
      description: "Social Studies",
    },
    {
      name: "General Knowledge",
      code: "GK",
      creditHours: 2,
      description: "General Knowledge",
    },
    {
      name: "Drawing",
      code: "DRAW",
      creditHours: 2,
      description: "Drawing & Art",
    },
  ];

  for (const subject of subjects) {
    await db.subject.upsert({
      where: {
        schoolId_code: {
          schoolId,
          code: subject.code,
        },
      },
      update: {
        name: subject.name,
        description: subject.description,
        creditHours: subject.creditHours,
        isActive: true,
      },
      create: {
        schoolId,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        creditHours: subject.creditHours,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${subjects.length} Subjects Seeded`);
}

seedSubjects()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });