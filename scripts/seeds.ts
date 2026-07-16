import { PrismaClient } from "@prisma/client";
import { seedAcademicYear } from "./seed-academic-year";
import { seedTerms } from "./seed-terms";
import { seedClasses } from "./seed-classes";
import { seedSubjects } from "./seed-subjects";
import { seedDepartments } from "./seed-departments";
import { seedDesignations } from "./seed-designations";
import { seedFeeTypes } from "./seed-fee-types";
import { seedGradeScale } from "./seed-grade-scale";
import { seedLeaveTypes } from "./seed-leave-types";
import { seedWorkingDays } from "./seed-working-days";
import { seedSchoolTimings } from "./seed-school-timings";
import { seedPeriods } from "./seed-periods";
import { seedHouses } from "./seed-houses";
import { seedHolidays } from "./seed-holidays";
import { seedTransportRoutes } from "./seed-transport-routes";
import { seedSchoolSettings } from "./seed-school-settings";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Demo School Seed...\n");

  const school = await prisma.school.upsert({
    where: {
      code: "DEMO-SCHOOL",
    },
    update: {},
    create: {
      name: "The Educators Demo Campus",
      code: "DEMO-SCHOOL",
      email: "admin@demo-school.com",
      phone: "+92-300-0000000",
      address: "Main Campus Road",
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan",
      zipCode: "74000",
      timezone: "Asia/Karachi",
      currency: "PKR",
    },
  });

  console.log(`✅ School Ready: ${school.name}`);

  const context = {
    prisma,
    schoolId: school.id,
  };

  await seedAcademicYear(context);
  await seedTerms(context);
  await seedClasses(context);
  await seedSubjects(context);
  await seedDepartments(context);
  await seedDesignations(context);
  await seedFeeTypes(context);
  await seedGradeScale(context);
  seedLeaveTypes();
  await seedWorkingDays(context);
  await seedSchoolTimings(context);
  await seedPeriods(context);
  await seedHouses(context);
  await seedHolidays(context);
  await seedTransportRoutes(context);
  await seedSchoolSettings(context);

  console.log("\n🎉 Demo School Seed Completed Successfully");
}

main()
  .catch((error) => {
    console.error("❌ Seed Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });