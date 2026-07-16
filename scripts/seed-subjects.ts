import { PrismaClient } from "@prisma/client";


interface Context {
 prisma:PrismaClient;
 schoolId:string;
}


export async function seedSubjects({
 prisma,
 schoolId
}:Context){


console.log("\n📖 Seeding Subjects...");


const classes =
await prisma.class.findMany({
where:{
schoolId
}
});


const subjects=[
{
name:"English",
code:"ENG"
},
{
name:"Mathematics",
code:"MATH"
},
{
name:"Urdu",
code:"URD"
},
{
name:"Science",
code:"SCI"
},
{
name:"Computer Science",
code:"CS"
},
{
name:"Islamiat",
code:"ISL"
},
{
name:"Social Studies",
code:"SST"
}
];


for(const cls of classes){


for(const subject of subjects){


await prisma.subject.upsert({

where:{
schoolId_code:{
schoolId,
code:`${subject.code}-${cls.name}`
}
},

update:{},

create:{
schoolId,
classId:cls.id,
name:subject.name,
code:`${subject.code}-${cls.name}`,
description:`${subject.name} for ${cls.name}`,
creditHours:1
}


});


}


console.log(
`✅ Subjects Added: ${cls.name}`
);


}


}