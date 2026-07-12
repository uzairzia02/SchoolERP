import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findUnique({ where: { code: "DEMO-002" } });

  if (!school) {
    console.log("❌ School with code DEMO-002 not found. Update the code below if yours is different.");
    return;
  }

  await prisma.schoolSettings.upsert({
    where: { schoolId: school.id },
    update: {
      bankName: "Habib Bank Limited (HBL)",
      bankAccountNumber: "0123-4567890123",
      bankBranch: "Main Branch, Karachi",
    },
    create: {
      schoolId: school.id,
      bankName: "Habib Bank Limited (HBL)",
      bankAccountNumber: "0123-4567890123",
      bankBranch: "Main Branch, Karachi",
    },
  });

  console.log("✅ Dummy bank details added for", school.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });