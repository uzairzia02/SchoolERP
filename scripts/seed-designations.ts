import { PrismaClient } from "@prisma/client";


interface Context {
 prisma:PrismaClient;
 schoolId:string;
}


export async function seedDesignations({
 prisma,
 schoolId
}:Context){


console.log("\n👔 Seeding Designations...");


const departments =
await prisma.department.findMany({
where:{
schoolId
}
});


const designationData=[

{
department:"Administration",
roles:[
"Principal",
"Vice Principal",
"Administrator"
]
},

{
department:"Academics",
roles:[
"Senior Teacher",
"Junior Teacher",
"Subject Specialist",
"Coordinator"
]
},

{
department:"Accounts",
roles:[
"Accountant",
"Fee Officer"
]
},

{
department:"Human Resource",
roles:[
"HR Manager",
"HR Officer"
]
},

{
department:"IT Department",
roles:[
"IT Manager",
"System Administrator"
]
},

{
department:"Transport",
roles:[
"Transport Manager",
"Driver"
]
},

{
department:"Security",
roles:[
"Security Guard",
"Security Supervisor"
]
}

];


for(const item of designationData){

const department =
departments.find(
d=>d.name===item.department
);


if(!department) continue;


for(const role of item.roles){


await prisma.designation.create({

data:{
schoolId,
departmentId:department.id,
name:role,
description:`${role} position`
}

});


console.log(
`✅ ${role}`
);


}

}


}