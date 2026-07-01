import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findFirst();
  if (!school) {
    console.log("No school found. Run seed.ts first.");
    return;
  }

  const departments = [
    { name: "Science", code: "SCI" },
    { name: "Mathematics", code: "MATH" },
    { name: "English", code: "ENG" },
    { name: "Social Studies", code: "SOC" },
    { name: "Computer Science", code: "CS" },
    { name: "Arts", code: "ARTS" },
    { name: "Physical Education", code: "PE" },
    { name: "Administration", code: "ADMIN" },
  ];

  for (const dept of departments) {
    const created = await db.department.upsert({
      where: { schoolId_code: { schoolId: school.id, code: dept.code } },
      update: {},
      create: { schoolId: school.id, name: dept.name, code: dept.code },
    });

    // Designations for each department
    const designations =
      dept.code === "ADMIN"
        ? ["Principal", "Vice Principal", "Office Coordinator"]
        : ["Senior Teacher", "Teacher", "Assistant Teacher"];

    for (const desigName of designations) {
      await db.designation.upsert({
        where: {
          id: `${created.id}-${desigName.replace(/\s/g, "")}`,
        },
        update: {},
        create: {
          id: `${created.id}-${desigName.replace(/\s/g, "")}`,
          schoolId: school.id,
          departmentId: created.id,
          name: desigName,
        },
      });
    }

    console.log(`✔ Department "${dept.name}" + designations created`);
  }

  console.log("\nDone! Departments and designations seeded.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());