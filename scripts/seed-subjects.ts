import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedSubjects({
  prisma,
  schoolId,
}:{
  prisma:PrismaClient;
  schoolId:string;
}) {

console.log("📚 Seeding Subjects...");


const subjects = [
  {
    name:"English",
    code:"ENG",
    description:"English Language"
  },
  {
    name:"Urdu",
    code:"URD",
    description:"Urdu Language"
  },
  {
    name:"Mathematics",
    code:"MATH",
    description:"Mathematics"
  },
  {
    name:"Science",
    code:"SCI",
    description:"General Science"
  },
  {
    name:"Computer Science",
    code:"CS",
    description:"Computer Science"
  },
  {
    name:"Islamiyat",
    code:"ISL",
    description:"Islamic Studies"
  },
  {
    name:"Social Studies",
    code:"SST",
    description:"Social Studies"
  }
];


// Create Master Subjects

const createdSubjects:any = {};

for(const subject of subjects){

const record = await prisma.subject.upsert({

where:{
 schoolId_code:{
   schoolId,
   code:subject.code
 }
},

update:{},

create:{
 schoolId,
 ...subject
}

});


createdSubjects[subject.code]=record;

}


// Assign Subjects To Classes

const classes = await prisma.class.findMany({
where:{
 schoolId
}
});


for(const cls of classes){


for(const subject of Object.values(createdSubjects)){


await prisma.classSubject.upsert({

where:{
 classId_subjectId:{
   classId:cls.id,
   subjectId:(subject as any).id
 }
},

update:{},

create:{
 classId:cls.id,
 subjectId:(subject as any).id
}

});


}

}


console.log("✅ Subjects + Class Mapping Completed");

}