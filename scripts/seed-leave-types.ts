import { LeaveType } from "@prisma/client";


export function seedLeaveTypes(){

console.log("\n🏖 Leave Types Available:");

const types=[

LeaveType.CASUAL,
LeaveType.SICK,
LeaveType.ANNUAL,
LeaveType.MATERNITY,
LeaveType.PATERNITY,
LeaveType.UNPAID

];


types.forEach(type=>{

console.log(
`✅ ${type}`
);

});


return types;

}