import { PrismaClient, Gender, UserRole } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedTeachers({
  prisma,
  schoolId,
}: SeedContext) {
  console.log("\n👨‍🏫 Seeding Teachers...");

  const teachers = [
    {
      employeeId: "TCH-001",
      firstName: "Ayesha",
      lastName: "Khan",
      email: "ayesha.khan@demo-school.com",
      phone: "03001234501",
      gender: Gender.FEMALE,
      department: "Academics",
      designation: "Senior Teacher",
      qualification: "M.Ed",
      experience: 8,
    },
    {
      employeeId: "TCH-002",
      firstName: "Muhammad",
      lastName: "Ahmed",
      email: "muhammad.ahmed@demo-school.com",
      phone: "03001234502",
      gender: Gender.MALE,
      department: "Academics",
      designation: "Subject Specialist",
      qualification: "M.Sc Mathematics",
      experience: 6,
    },
    {
      employeeId: "TCH-003",
      firstName: "Fatima",
      lastName: "Ali",
      email: "fatima.ali@demo-school.com",
      phone: "03001234503",
      gender: Gender.FEMALE,
      department: "Academics",
      designation: "Junior Teacher",
      qualification: "B.Ed",
      experience: 3,
    },
    {
      employeeId: "TCH-004",
      firstName: "Hassan",
      lastName: "Raza",
      email: "hassan.raza@demo-school.com",
      phone: "03001234504",
      gender: Gender.MALE,
      department: "Academics",
      designation: "Senior Teacher",
      qualification: "M.A English",
      experience: 7,
    },
    {
      employeeId: "TCH-005",
      firstName: "Sadia",
      lastName: "Iqbal",
      email: "sadia.iqbal@demo-school.com",
      phone: "03001234505",
      gender: Gender.FEMALE,
      department: "Academics",
      designation: "Coordinator",
      qualification: "M.Ed",
      experience: 10,
    },
  ];


  for (const teacher of teachers) {

    const department = await prisma.department.findFirst({
      where: {
        schoolId,
        name: teacher.department,
      },
    });


    const designation = await prisma.designation.findFirst({
      where: {
        schoolId,
        name: teacher.designation,
      },
    });


    if (!department) {
      console.log(
        `⚠️ Department missing: ${teacher.department}`
      );
      continue;
    }


    if (!designation) {
      console.log(
        `⚠️ Designation missing: ${teacher.designation}`
      );
      continue;
    }


    const user = await prisma.user.upsert({
      where: {
        email: teacher.email,
      },

      update: {},

      create: {
        schoolId,
        email: teacher.email,
        password: "Password@123",
        role: UserRole.TEACHER,
      },
    });


    await prisma.teacher.upsert({

      where: {
        schoolId_employeeId: {
          schoolId,
          employeeId: teacher.employeeId,
        },
      },


      update: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        departmentId: department.id,
        designationId: designation.id,
        qualification: teacher.qualification,
        experience: teacher.experience,
      },


      create: {

        schoolId,

        userId: user.id,

        employeeId: teacher.employeeId,

        firstName: teacher.firstName,

        lastName: teacher.lastName,

        email: teacher.email,

        phone: teacher.phone,

        gender: teacher.gender,

        departmentId: department.id,

        designationId: designation.id,

        qualification: teacher.qualification,

        experience: teacher.experience,

        joiningDate: new Date("2025-01-01"),

        isActive: true,

      },

    });


    console.log(
      `✅ Teacher created: ${teacher.firstName} ${teacher.lastName}`
    );
  }


  console.log("✅ Teachers Seed Completed");
}