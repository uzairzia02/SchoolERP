import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Check if already seeded
  const existing = await db.school.findFirst();
  if (existing) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  // Create school
  const school = await db.school.create({
    data: {
      name: "Greenwood International School",
      code: "GIS",
      email: "info@greenwood.edu",
      phone: "+92-21-1234567",
      address: "123 Education Avenue",
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan",
      zipCode: "75500",
    },
  });

  console.log(`✔ School created: ${school.name} (${school.id})`);

  // Create super admin
  const hashedPassword = await hash("Admin@123456", 12);

  const admin = await db.user.create({
    data: {
      schoolId: school.id,
      email: "admin@greenwood.edu",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`✔ Super Admin created: ${admin.email}`);
  console.log("");
  console.log("─────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Email:    admin@greenwood.edu");
  console.log("  Password: Admin@123456");
  console.log("─────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());