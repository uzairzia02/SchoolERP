import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedClassSubjects() {
  console.log("📘 Seeding Class Subject Mapping...");

  const school = await prisma.school.findFirst({
    where: { code: "DEMO-SCHOOL" },
  });

  if (!school) throw new Error("Demo school not found.");

  const classes = await prisma.class.findMany({
    where: { schoolId: school.id },
  });

  const subjects = await prisma.subject.findMany({
    where: { schoolId: school.id },
  });

  const classMap = new Map(classes.map((c) => [c.name, c.id]));
  const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));

  const mappings = [
    // KG-1
    {
      className: "KG-1",
      subjects: ["ENG", "URD", "MATH", "GK", "DRAW"],
    },

    // Class 1-5
    ...["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"].map((c) => ({
      className: c,
      subjects: [
        "ENG",
        "URD",
        "MATH",
        "SCI",
        "ISL",
        "SST",
        "COMP",
      ],
    })),

    // Class 6-8
    ...["Class 6", "Class 7", "Class 8"].map((c) => ({
      className: c,
      subjects: [
        "ENG",
        "URD",
        "MATH",
        "PHY",
        "CHEM",
        "BIO",
        "COMP",
        "PAK",
        "ISL",
      ],
    })),

    // Class 9-10
    ...["Class 9", "Class 10"].map((c) => ({
      className: c,
      subjects: [
        "ENG",
        "URD",
        "MATH",
        "PHY",
        "CHEM",
        "BIO",
        "COMP",
        "PAK",
        "ISL",
      ],
    })),
  ];

  for (const item of mappings) {
    const classId = classMap.get(item.className);

    if (!classId) continue;

    for (const code of item.subjects) {
      const subjectId = subjectMap.get(code);

      if (!subjectId) continue;

      await prisma.classSubject.upsert({
        where: {
          classId_subjectId: {
            classId,
            subjectId,
          },
        },
        update: {},
        create: {
          classId,
          subjectId,
        },
      });
    }
  }

  console.log("✅ Class Subject Mapping Completed");
}

seedClassSubjects()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });