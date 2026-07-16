// ============================================================
// School ERP — Employee Seed
// Non Teaching Staff Demo Data
// ============================================================

import { PrismaClient, Gender, UserRole } from "@prisma/client";

interface Context {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedEmployees({
  prisma,
  schoolId,
}: Context) {

  console.log("\n👨‍💼 Seeding Employees...");


  const employees = [
    {
      employeeId: "EMP-0001",
      firstName: "Ali",
      lastName: "Raza",
      email: "ali.raza@demo-school.com",
      phone: "03001234567",
      gender: Gender.MALE,
      department: "Administration",
      designation: "Administrator",
      salary: 80000,
    },

    {
      employeeId: "EMP-0002",
      firstName: "Sana",
      lastName: "Iqbal",
      email: "sana.iqbal@demo-school.com",
      phone: "03001234568",
      gender: Gender.FEMALE,
      department: "Human Resource",
      designation: "HR Officer",
      salary: 60000,
    },

    {
      employeeId: "EMP-0003",
      firstName: "Usman",
      lastName: "Khan",
      email: "usman.khan@demo-school.com",
      phone: "03001234569",
      gender: Gender.MALE,
      department: "Accounts",
      designation: "Accountant",
      salary: 70000,
    },

    {
      employeeId: "EMP-0004",
      firstName: "Bilal",
      lastName: "Ahmed",
      email: "bilal.ahmed@demo-school.com",
      phone: "03001234570",
      gender: Gender.MALE,
      department: "Accounts",
      designation: "Fee Officer",
      salary: 45000,
    },

    {
      employeeId: "EMP-0005",
      firstName: "Hamza",
      lastName: "Ali",
      email: "hamza.ali@demo-school.com",
      phone: "03001234571",
      gender: Gender.MALE,
      department: "IT Department",
      designation: "System Administrator",
      salary: 65000,
    },

    {
      employeeId: "EMP-0006",
      firstName: "Imran",
      lastName: "Shah",
      email: "imran.shah@demo-school.com",
      phone: "03001234572",
      gender: Gender.MALE,
      department: "Transport",
      designation: "Transport Manager",
      salary: 55000,
    },

    {
      employeeId: "EMP-0007",
      firstName: "Nadeem",
      lastName: "Ahmed",
      email: "nadeem.ahmed@demo-school.com",
      phone: "03001234573",
      gender: Gender.MALE,
      department: "Security",
      designation: "Security Supervisor",
      salary: 45000,
    },

    {
      employeeId: "EMP-0008",
      firstName: "Rashid",
      lastName: "Khan",
      email: "rashid.khan@demo-school.com",
      phone: "03001234574",
      gender: Gender.MALE,
      department: "Security",
      designation: "Security Guard",
      salary: 35000,
    },
  ];


  for (const employee of employees) {

    const department =
      await prisma.department.findFirst({
        where:{
          schoolId,
          name: employee.department
        }
      });


    const designation =
      await prisma.designation.findFirst({
        where:{
          schoolId,
          name: employee.designation
        }
      });


    if(!department){
      console.log(
        `⚠️ Department missing: ${employee.department}`
      );
      continue;
    }


    if(!designation){
      console.log(
        `⚠️ Designation missing: ${employee.designation}`
      );
      continue;
    }


    const user =
      await prisma.user.upsert({

        where:{
          email: employee.email
        },

        update:{},

        create:{
          schoolId,
          email: employee.email,
          password:"Password@123",
          role:UserRole.HR
        }

      });

          await prisma.employee.upsert({

      where:{
        schoolId_employeeId:{
          schoolId,
          employeeId: employee.employeeId
        }
      },

      update:{
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        departmentId: department.id,
        designationId: designation.id,
        salary: employee.salary
      },


      create:{

        schoolId,

        userId:user.id,

        employeeId: employee.employeeId,

        firstName: employee.firstName,

        lastName: employee.lastName,

        email: employee.email,

        phone: employee.phone,

        gender: employee.gender,

        departmentId: department.id,

        designationId: designation.id,

        salary: employee.salary,

        joiningDate: new Date("2025-01-01"),

        isActive:true

      }

    });


    console.log(
      `✅ Employee Created: ${employee.firstName} ${employee.lastName}`
    );

  }


  console.log("✅ Employees Seed Completed");

}