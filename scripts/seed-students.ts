import {
  PrismaClient,
  Gender,
  BloodGroup,
  UserRole,
} from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedStudents({
  prisma,
  schoolId,
}: SeedContext) {

  console.log("\n🎓 Seeding Students...");


  const classes = await prisma.class.findMany({
    where: {
      schoolId,
    },
    include: {
      sections: true,
    },
  });


  if (!classes.length) {
    console.log("⚠️ No classes found. Run seed-classes first.");
    return;
  }


  const parents = await prisma.parent.findMany({
    where: {
      schoolId,
    },
  });


  if (!parents.length) {
    console.log("⚠️ No parents found. Run seed-parents first.");
    return;
  }



  const students = [

    {
      admissionNumber: "ADM-0001",
      firstName: "Ahmed",
      lastName: "Hassan",
      gender: Gender.MALE,
      bloodGroup: BloodGroup.B_POSITIVE,
      className: "Class 1",
      parentIndex: 0,
    },

    {
      admissionNumber: "ADM-0002",
      firstName: "Areeba",
      lastName: "Ali",
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.A_POSITIVE,
      className: "Class 2",
      parentIndex: 1,
    },

    {
      admissionNumber: "ADM-0003",
      firstName: "Hamza",
      lastName: "Raza",
      gender: Gender.MALE,
      bloodGroup: BloodGroup.O_POSITIVE,
      className: "Class 3",
      parentIndex: 2,
    },

    {
      admissionNumber: "ADM-0004",
      firstName: "Fatima",
      lastName: "Khan",
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.AB_POSITIVE,
      className: "Class 4",
      parentIndex: 3,
    },

    {
      admissionNumber: "ADM-0005",
      firstName: "Zain",
      lastName: "Ahmed",
      gender: Gender.MALE,
      bloodGroup: BloodGroup.O_NEGATIVE,
      className: "Class 5",
      parentIndex: 4,
    },

  ];



  for (const student of students) {


    const classData = classes.find(
      (c) =>
        c.name.toLowerCase() ===
        student.className.toLowerCase()
    );


    if (!classData) {

      console.log(
        `⚠️ Class missing: ${student.className}`
      );

      continue;

    }



    const section =
      classData.sections[0];


    const email =
      `${student.admissionNumber.toLowerCase()}@student.demo-school.com`;



    const user = await prisma.user.upsert({

      where: {
        email,
      },

      update: {},

      create: {

        schoolId,

        email,

        password: "Password@123",

        role: UserRole.STUDENT,

      },

    });



    const createdStudent =
      await prisma.student.upsert({

        where: {

          schoolId_admissionNumber: {

            schoolId,

            admissionNumber:
              student.admissionNumber,

          },

        },


        update: {

          firstName:
            student.firstName,

          lastName:
            student.lastName,

          classId:
            classData.id,

          sectionId:
            section?.id,

        },


        create: {

          schoolId,

          userId:user.id,

          admissionNumber:
            student.admissionNumber,

          firstName:
            student.firstName,

          lastName:
            student.lastName,

          dateOfBirth:
            new Date("2018-01-15"),

          gender:
            student.gender,

          bloodGroup:
            student.bloodGroup,

          nationality:
            "Pakistani",

          classId:
            classData.id,

          sectionId:
            section?.id,

          rollNumber:
            student.admissionNumber.replace(
              "ADM-",
              ""
            ),

          admissionDate:
            new Date("2025-04-01"),

          isActive:true,

        },

      });



    const parent =
      parents[student.parentIndex];



    if(parent){

      await prisma.studentParent.upsert({

        where:{

          studentId_parentId:{

            studentId:
              createdStudent.id,

            parentId:
              parent.id,

          },

        },


        update:{},

        create:{

          studentId:
            createdStudent.id,

          parentId:
            parent.id,

          relation:
            student.gender === Gender.FEMALE
            ? "Mother"
            : "Father",

        },

      });

    }



    console.log(
      `✅ Student created: ${student.firstName} ${student.lastName}`
    );

  }


  console.log("✅ Students Seed Completed");

}