import { PrismaClient } from "@prisma/client";

interface Context {
  prisma: PrismaClient;
  schoolId: string;
}


export async function seedTerms({
  prisma,
  schoolId,
}: Context) {

  console.log("\n📅 Seeding Terms...");


  const terms = [
    {
      name:"Term 1",
      startDate:"2025-04-01",
      endDate:"2025-07-31",
      weightage:33
    },
    {
      name:"Term 2",
      startDate:"2025-08-01",
      endDate:"2025-11-30",
      weightage:33
    },
    {
      name:"Term 3",
      startDate:"2025-12-01",
      endDate:"2026-03-31",
      weightage:34
    }
  ];


  for(const term of terms){

    await prisma.term.create({
      data:{
        schoolId,
        name:term.name,
        startDate:new Date(term.startDate),
        endDate:new Date(term.endDate),
        session:"2025-2026",
        weightage:term.weightage
      }
    });


    console.log(`✅ ${term.name}`);
  }

}