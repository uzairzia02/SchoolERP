import { PrismaClient } from "@prisma/client";

interface Context {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedDepartments({
  prisma,
  schoolId,
}: Context) {

  console.log("\n🏢 Seeding Departments...");

  const departments = [
    {
      name: "Administration",
      code: "ADMIN",
      description: "School administration department",
    },
    {
      name: "Academics",
      code: "ACA",
      description: "Teaching and academic operations",
    },
    {
      name: "Accounts",
      code: "ACC",
      description: "Finance and fee management",
    },
    {
      name: "Human Resource",
      code: "HR",
      description: "Employee management",
    },
    {
      name: "IT Department",
      code: "IT",
      description: "Technology and systems",
    },
    {
      name: "Transport",
      code: "TRANS",
      description: "Transport management",
    },
    {
      name: "Security",
      code: "SEC",
      description: "Campus security",
    },
  ];


  for (const dept of departments) {

    await prisma.department.upsert({

      where:{
        schoolId_code:{
          schoolId,
          code:dept.code
        }
      },

      update:{},

      create:{
        schoolId,
        name:dept.name,
        code:dept.code,
        description:dept.description
      }

    });


    console.log(`✅ ${dept.name}`);
  }

}