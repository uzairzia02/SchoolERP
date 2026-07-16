import { PrismaClient } from "@prisma/client";


interface Context {
 prisma:PrismaClient;
 schoolId:string;
}


export async function seedClasses({
 prisma,
 schoolId
}:Context){


console.log("\n🏫 Seeding Classes...");


const academicYear =
await prisma.academicYear.findFirst({
where:{
schoolId,
isCurrent:true
}
});


if(!academicYear){
 throw new Error(
 "Academic Year not found"
 );
}


const classes=[
"KG1",
"Class 1",
"Class 2",
"Class 3",
"Class 4",
"Class 5",
"Class 6",
"Class 7",
"Class 8",
"Class 9",
"Class 10"
];


for(let i=0;i<classes.length;i++){

const className=classes[i];


const schoolClass =
await prisma.class.upsert({

where:{
schoolId_name:{
schoolId,
name:className
}
},

update:{},

create:{
schoolId,
academicYearId:academicYear.id,
name:className,
displayName:className,
order:i+1
}

});


console.log(
`✅ ${className}`
);



const sections=[
"A",
"B"
];


for(const section of sections){

await prisma.section.upsert({

where:{
classId_name:{
classId:schoolClass.id,
name:section
}
},

update:{},

create:{
schoolId,
classId:schoolClass.id,
name:section,
capacity:40
}

});

console.log(
`   ↳ Section ${section}`
);


}


}


}