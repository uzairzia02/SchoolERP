import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findFirst();
  if (!school) {
    console.log("No school found.");
    return;
  }

  const schoolId = school.id;

  // ─────────────────────────────────────────────────────────────
  // DEPARTMENTS — Full school structure
  // ─────────────────────────────────────────────────────────────

  const departmentData = [
    // Academic Departments
    { name: "Mathematics", code: "MATH", description: "Mathematics department covering all classes" },
    { name: "Science", code: "SCI", description: "Physics, Chemistry, Biology" },
    { name: "English", code: "ENG", description: "English Language and Literature" },
    { name: "Urdu", code: "URD", description: "Urdu Language and Literature" },
    { name: "Social Studies", code: "SOC", description: "History, Geography, Civics, Islamiat" },
    { name: "Computer Science", code: "CS", description: "Computer Science and IT" },
    { name: "Islamic Studies", code: "ISL", description: "Islamiat and Quran" },
    { name: "Arts & Crafts", code: "ARTS", description: "Fine Arts, Drawing, Crafts" },
    { name: "Physical Education", code: "PE", description: "Sports, Physical Training, Health" },
    { name: "Early Childhood", code: "ECE", description: "Nursery, KG, Pre-Primary classes" },
    // Administrative Departments
    { name: "Administration", code: "ADMIN", description: "Principal, Vice Principal, Management" },
    { name: "Human Resources", code: "HR", description: "HR, Recruitment, Payroll" },
    { name: "Finance & Accounts", code: "FIN", description: "Fee collection, Accounts, Payroll" },
    { name: "IT & Systems", code: "IT", description: "Computer lab, IT infrastructure, ERP" },
    { name: "Library", code: "LIB", description: "School library management" },
    { name: "Transport", code: "TRANS", description: "Bus routes, drivers, transport coordination" },
    { name: "Security & Maintenance", code: "SEC", description: "Security guards, maintenance, janitorial" },
    { name: "Medical & Health", code: "MED", description: "School nurse, health room" },
    { name: "Canteen", code: "CAN", description: "School canteen and food services" },
  ];

  const departments: Record<string, string> = {};

  for (const dept of departmentData) {
    const created = await db.department.upsert({
      where: { schoolId_code: { schoolId, code: dept.code } },
      update: { name: dept.name, description: dept.description },
      create: { schoolId, ...dept },
    });
    departments[dept.code] = created.id;
    console.log(`✔ Department: ${dept.name}`);
  }

  // ─────────────────────────────────────────────────────────────
  // DESIGNATIONS — Per Department
  // ─────────────────────────────────────────────────────────────

  const designationData = [
    // Administration
    { name: "Principal", code: "PRIN", deptCode: "ADMIN", description: "Head of the school" },
    { name: "Vice Principal", code: "VP", deptCode: "ADMIN", description: "Deputy head of school" },
    { name: "Director", code: "DIR", deptCode: "ADMIN", description: "School director / owner representative" },
    { name: "School Coordinator", code: "SCOORD", deptCode: "ADMIN", description: "Academic and admin coordination" },
    { name: "Admin Officer", code: "ADMOFF", deptCode: "ADMIN", description: "Administrative duties" },
    { name: "Receptionist", code: "RECEP", deptCode: "ADMIN", description: "Front desk and visitor management" },
    { name: "Data Entry Operator", code: "DEO", deptCode: "ADMIN", description: "Data entry and record keeping" },
    { name: "Office Assistant", code: "OFFASST", deptCode: "ADMIN", description: "General office assistance" },

    // Academic — Teaching Staff
    { name: "Senior Teacher", code: "SR_TCH", deptCode: "MATH", description: "Senior teaching staff" },
    { name: "Teacher", code: "TCH", deptCode: "MATH", description: "Regular class teacher" },
    { name: "Assistant Teacher", code: "ASST_TCH", deptCode: "MATH", description: "Assists main teacher" },
    { name: "Subject Specialist", code: "SPEC", deptCode: "SCI", description: "Specialist in specific subject" },
    { name: "Senior Teacher", code: "SR_TCH_SCI", deptCode: "SCI", description: "Senior science teacher" },
    { name: "Teacher", code: "TCH_SCI", deptCode: "SCI", description: "Science teacher" },
    { name: "Senior Teacher", code: "SR_TCH_ENG", deptCode: "ENG", description: "Senior English teacher" },
    { name: "Teacher", code: "TCH_ENG", deptCode: "ENG", description: "English teacher" },
    { name: "Senior Teacher", code: "SR_TCH_URD", deptCode: "URD", description: "Senior Urdu teacher" },
    { name: "Teacher", code: "TCH_URD", deptCode: "URD", description: "Urdu teacher" },
    { name: "Teacher", code: "TCH_SOC", deptCode: "SOC", description: "Social Studies teacher" },
    { name: "Teacher", code: "TCH_ISL", deptCode: "ISL", description: "Islamiat / Quran teacher" },
    { name: "Hafiz / Qari", code: "HAFIZ", deptCode: "ISL", description: "Quran Hafiz or Qari" },
    { name: "Computer Teacher", code: "CS_TCH", deptCode: "CS", description: "Computer Science teacher" },
    { name: "Lab Instructor", code: "LAB_INS", deptCode: "CS", description: "Computer lab instructor" },
    { name: "Arts Teacher", code: "ARTS_TCH", deptCode: "ARTS", description: "Arts and crafts teacher" },
    { name: "PT Instructor", code: "PT_INS", deptCode: "PE", description: "Physical Training instructor" },
    { name: "Sports Coach", code: "COACH", deptCode: "PE", description: "Sports coach" },
    { name: "Nursery Teacher", code: "NUR_TCH", deptCode: "ECE", description: "Nursery/KG class teacher" },
    { name: "Class Teacher", code: "CL_TCH", deptCode: "ECE", description: "Pre-primary class teacher" },

    // HR Department
    { name: "HR Manager", code: "HR_MGR", deptCode: "HR", description: "Head of HR department" },
    { name: "HR Officer", code: "HR_OFF", deptCode: "HR", description: "HR operations" },
    { name: "HR Assistant", code: "HR_ASST", deptCode: "HR", description: "HR administrative support" },
    { name: "Payroll Officer", code: "PAY_OFF", deptCode: "HR", description: "Salary and payroll processing" },

    // Finance Department
    { name: "Accounts Manager", code: "ACC_MGR", deptCode: "FIN", description: "Head of accounts" },
    { name: "Accountant", code: "ACC", deptCode: "FIN", description: "Financial accounts management" },
    { name: "Fee Collector", code: "FEE_COL", deptCode: "FIN", description: "Fee collection counter" },
    { name: "Cashier", code: "CASH", deptCode: "FIN", description: "Cash handling" },
    { name: "Audit Officer", code: "AUDIT", deptCode: "FIN", description: "Internal audit" },

    // IT Department
    { name: "IT Manager", code: "IT_MGR", deptCode: "IT", description: "IT department head" },
    { name: "System Administrator", code: "SYSADM", deptCode: "IT", description: "System and network admin" },
    { name: "IT Technician", code: "IT_TECH", deptCode: "IT", description: "Hardware and software support" },
    { name: "Lab Assistant", code: "LAB_ASST", deptCode: "IT", description: "Computer lab assistant" },

    // Library
    { name: "Librarian", code: "LIB_HEAD", deptCode: "LIB", description: "Head librarian" },
    { name: "Library Assistant", code: "LIB_ASST", deptCode: "LIB", description: "Library support staff" },

    // Transport
    { name: "Transport Coordinator", code: "TRANS_COORD", deptCode: "TRANS", description: "Transport operations manager" },
    { name: "Bus Driver", code: "DRIVER", deptCode: "TRANS", description: "School bus driver" },
    { name: "Van Driver", code: "VAN_DRV", deptCode: "TRANS", description: "School van driver" },
    { name: "Transport Assistant", code: "TRANS_ASST", deptCode: "TRANS", description: "Assists on transport routes" },

    // Security & Maintenance
    { name: "Security Supervisor", code: "SEC_SUP", deptCode: "SEC", description: "Head of security" },
    { name: "Security Guard", code: "GUARD", deptCode: "SEC", description: "Gate and premises security" },
    { name: "Maintenance Supervisor", code: "MAINT_SUP", deptCode: "SEC", description: "Facilities maintenance head" },
    { name: "Electrician", code: "ELEC", deptCode: "SEC", description: "Electrical maintenance" },
    { name: "Plumber", code: "PLUMB", deptCode: "SEC", description: "Plumbing maintenance" },
    { name: "Sweeper / Cleaner", code: "SWEEP", deptCode: "SEC", description: "Cleaning and janitorial" },
    { name: "Gardner", code: "GARD", deptCode: "SEC", description: "Garden and grounds maintenance" },
    { name: "Peon / Office Boy", code: "PEON", deptCode: "SEC", description: "Office errands and support" },

    // Medical
    { name: "School Nurse", code: "NURSE", deptCode: "MED", description: "Medical first aid and health" },
    { name: "Doctor (Part-time)", code: "DOC_PT", deptCode: "MED", description: "Visiting doctor" },

    // Canteen
    { name: "Canteen Manager", code: "CAN_MGR", deptCode: "CAN", description: "Canteen operations" },
    { name: "Canteen Staff", code: "CAN_STF", deptCode: "CAN", description: "Canteen food preparation" },
  ];

  for (const desig of designationData) {
    const deptId = departments[desig.deptCode];
    if (!deptId) {
      console.log(`⚠ Department not found for code: ${desig.deptCode}`);
      continue;
    }

    await db.designation.upsert({
      where: { id: `${deptId}-${desig.code}` },
      update: { name: desig.name, description: desig.description },
      create: {
        id: `${deptId}-${desig.code}`,
        schoolId,
        departmentId: deptId,
        name: desig.name,
        description: desig.description,
      },
    });
    console.log(`  ✔ Designation: ${desig.name} (${desig.deptCode})`);
  }

  console.log("\n✅ All departments and designations seeded successfully!");
  console.log(`Total departments: ${departmentData.length}`);
  console.log(`Total designations: ${designationData.length}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());