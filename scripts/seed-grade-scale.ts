import { PrismaClient } from "@prisma/client";


interface Context {
 prisma:PrismaClient;
 schoolId:string;
}


export async function seedGradeScale({
 prisma,
 schoolId
}:Context){


console.log("\n📊 Seeding Grade Scale...");


const grades=[

{
grade:"A+",
minMarks:90,
maxMarks:100,
gpa:4.0,
remarks:"Excellent"
},

{
grade:"A",
minMarks:80,
maxMarks:89,
gpa:3.7,
remarks:"Very Good"
},

{
grade:"B",
minMarks:70,
maxMarks:79,
gpa:3.0,
remarks:"Good"
},

{
grade:"C",
minMarks:60,
maxMarks:69,
gpa:2.5,
remarks:"Average"
},

{
grade:"D",
minMarks:50,
maxMarks:59,
gpa:2.0,
remarks:"Pass"
},

{
grade:"F",
minMarks:0,
maxMarks:49,
gpa:0,
remarks:"Fail"
}

];


for(const grade of grades){


await prisma.gradeScale.create({

data:{
schoolId,
...grade
}

});


console.log(
`✅ ${grade.grade}`
);


}


}