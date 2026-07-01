import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findFirst();
  if (!school) {
    console.log("No school found. Run seed.ts first.");
    return;
  }

  const classes = [
    { name: "1", displayName: "Class 1", order: 1 },
    { name: "2", displayName: "Class 2", order: 2 },
    { name: "3", displayName: "Class 3", order: 3 },
    { name: "4", displayName: "Class 4", order: 4 },
    { name: "5", displayName: "Class 5", order: 5 },
    { name: "6", displayName: "Class 6", order: 6 },
    { name: "7", displayName: "Class 7", order: 7 },
    { name: "8", displayName: "Class 8", order: 8 },
    { name: "9", displayName: "Class 9", order: 9 },
    { name: "10", displayName: "Class 10", order: 10 },
  ];

  for (const cls of classes) {
    const created = await db.class.upsert({
      where: { schoolId_name: { schoolId: school.id, name: cls.name } },
      update: {},
      create: {
        schoolId: school.id,
        name: cls.name,
        displayName: cls.displayName,
        order: cls.order,
      },
    });

    // Create sections A and B for each class
    for (const sectionName of ["A", "B"]) {
      await db.section.upsert({
        where: { classId_name: { classId: created.id, name: sectionName } },
        update: {},
        create: {
          schoolId: school.id,
          classId: created.id,
          name: sectionName,
          capacity: 40,
        },
      });
    }

    console.log(`✔ Class ${cls.displayName} + Sections A, B created`);
  }

  console.log("\nDone! Classes and sections seeded.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());