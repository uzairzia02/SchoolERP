import { PrismaClient, FeeStatus, PaymentMethod } from "@prisma/client";

interface SeedContext {
  prisma: PrismaClient;
  schoolId: string;
}

export async function seedFees({
  prisma,
  schoolId,
}: SeedContext) {

  console.log("\n💰 Seeding Student Fees...");


  const students = await prisma.student.findMany({
    where: {
      schoolId,
    },
  });


  const feeTypes = await prisma.feeType.findMany({
    where: {
      schoolId,
    },
  });


  if (!students.length) {
    console.log("⚠️ No students found. Run seed-students first.");
    return;
  }


  if (!feeTypes.length) {
    console.log("⚠️ No fee types found. Run seed-fee-types first.");
    return;
  }



  const currentYear = new Date().getFullYear();



  for (const student of students) {


    for (const feeType of feeTypes) {


      const dueDate = new Date(
        `${currentYear}-05-10`
      );


      const paid =
        feeType.name.toLowerCase().includes("admission");



      await prisma.fee.upsert({

        where: {

          id:
            `${student.id}-${feeType.id}`

        },


        update: {

          amount:
            feeType.amount,

          status:
            paid
              ? FeeStatus.PAID
              : FeeStatus.UNPAID,

          paidAmount:
            paid
              ? feeType.amount
              : 0,

          paymentMethod:
            paid
              ? PaymentMethod.CASH
              : null,

          paidDate:
            paid
              ? new Date()
              : null,

        },


        create: {

          schoolId,

          studentId:
            student.id,

          feeTypeId:
            feeType.id,


          amount:
            feeType.amount,


          discount:
            0,


          fine:
            0,


          paidAmount:
            paid
              ? feeType.amount
              : 0,


          dueDate,


          paidDate:
            paid
              ? new Date()
              : null,


          status:
            paid
              ? FeeStatus.PAID
              : FeeStatus.UNPAID,


          paymentMethod:
            paid
              ? PaymentMethod.CASH
              : null,


          receiptNumber:
            paid
              ? `REC-${student.admissionNumber}`
              : null,


          remarks:
            paid
              ? "Demo payment received"
              : "Monthly fee pending",

        },

      });


      console.log(
        `✅ Fee created: ${student.firstName} - ${feeType.name}`
      );

    }

  }


  console.log("✅ Fees Seed Completed");

}