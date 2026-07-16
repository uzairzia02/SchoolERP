import { PrismaClient, UserRole } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedParents({
  prisma,
  schoolId,
}: SeedContext) {

  console.log("\n👨‍👩‍👧 Seeding Parents...");


  const parents = [
    {
      firstName: "Ali",
      lastName: "Hassan",
      email: "ali.hassan.parent@demo-school.com",
      phone: "03001300001",
      occupation: "Business",
      address: "North Nazimabad, Karachi",
    },

    {
      firstName: "Sara",
      lastName: "Ahmed",
      email: "sara.ahmed.parent@demo-school.com",
      phone: "03001300002",
      occupation: "Teacher",
      address: "Gulshan-e-Iqbal, Karachi",
    },

    {
      firstName: "Usman",
      lastName: "Raza",
      email: "usman.raza.parent@demo-school.com",
      phone: "03001300003",
      occupation: "Engineer",
      address: "PECHS, Karachi",
    },

    {
      firstName: "Nadia",
      lastName: "Khan",
      email: "nadia.khan.parent@demo-school.com",
      phone: "03001300004",
      occupation: "Doctor",
      address: "Clifton, Karachi",
    },

    {
      firstName: "Imran",
      lastName: "Ali",
      email: "imran.ali.parent@demo-school.com",
      phone: "03001300005",
      occupation: "Manager",
      address: "Federal B Area, Karachi",
    },
  ];


  for (const parent of parents) {


    const user = await prisma.user.upsert({

      where: {
        email: parent.email,
      },

      update: {},

      create: {
        schoolId,
        email: parent.email,
        password: "Password@123",
        role: UserRole.PARENT,
      },

    });



    await prisma.parent.upsert({

      where: {
        userId: user.id,
      },


      update: {

        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        occupation: parent.occupation,
        address: parent.address,

      },


      create: {

        schoolId,

        userId: user.id,

        firstName: parent.firstName,

        lastName: parent.lastName,

        email: parent.email,

        phone: parent.phone,

        occupation: parent.occupation,

        address: parent.address,

        city: "Karachi",

        country: "Pakistan",

        isActive: true,

      },

    });


    console.log(
      `✅ Parent created: ${parent.firstName} ${parent.lastName}`
    );

  }


  console.log("✅ Parents Seed Completed");

}