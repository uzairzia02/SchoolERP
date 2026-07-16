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
      name: "Metropolitan Academy",
      code: "MA",
      email: "info@metropolitan.com",
      phone: "+92-21-36363629",
      address: "Naseerabad",
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
      email: "admin@metropolitan.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`✔ Super Admin created: ${admin.email}`);
  console.log("");
  console.log("─────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Email:    admin@metropolitan.com");
  console.log("  Password: Admin@123456");
  console.log("─────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());