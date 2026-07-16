import { PrismaClient } from "@prisma/client";


interface Context {
 prisma:PrismaClient;
 schoolId:string;
}


export async function seedFeeTypes({
 prisma,
 schoolId
}:Context){


console.log("\n💰 Seeding Fee Types...");


const fees=[

{
name:"Monthly Tuition Fee",
amount:5000,
isRecurring:true
},

{
name:"Admission Fee",
amount:10000,
isRecurring:false
},

{
name:"Annual Charges",
amount:8000,
isRecurring:false
},

{
name:"Computer Lab Fee",
amount:1500,
isRecurring:true
},

{
name:"Transport Fee",
amount:3000,
isRecurring:true
},

{
name:"Exam Fee",
amount:1000,
isRecurring:false
}

];


for(const fee of fees){


const existing =
await prisma.feeType.findFirst({

where:{
schoolId,
name:fee.name
}

});


if(existing){

console.log(
`↳ Exists ${fee.name}`
);

continue;

}


await prisma.feeType.create({

data:{
schoolId,
name:fee.name,
amount:fee.amount,
isRecurring:fee.isRecurring,
description:`${fee.name} charges`
}

});


console.log(
`✅ ${fee.name}`
);


}


}