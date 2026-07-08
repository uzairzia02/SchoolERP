import { PrismaClient, UserRole, Gender, LeaveType, LeaveStatus, FeeStatus, ExamType, DayOfWeek } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const TEST_PASSWORD = "Test@123";

function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ];
  return days[new Date().getDay()];
}

async function main() {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // Reuse existing school if you already seeded one; otherwise create it
  const school = await prisma.school.upsert({
    where: { code: "DEMO-001" },
    update: {},
    create: {
      name: "Demo International School",
      code: "DEMO-001",
      email: "school@demo.com",
      phone: "0300-0000000",
      address: "123 Main Street",
      city: "Karachi",
      state: "Sindh",
      country: "Pakistan",
      zipCode: "74000",
      currency: "PKR",
      timezone: "Asia/Karachi",
    },
  });

  const teachingDept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: "TEACH" } },
    update: {},
    create: { schoolId: school.id, name: "Teaching Staff", code: "TEACH" },
  });

  const adminDept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: "ADMIN" } },
    update: {},
    create: { schoolId: school.id, name: "Administration", code: "ADMIN" },
  });

  const teacherDesignation = await prisma.designation.upsert({
    where: { id: "seed-designation-teacher" },
    update: {},
    create: {
      id: "seed-designation-teacher",
      schoolId: school.id,
      departmentId: teachingDept.id,
      name: "Subject Teacher",
    },
  });

  const hrDesignation = await prisma.designation.upsert({
    where: { id: "seed-designation-hr" },
    update: {},
    create: {
      id: "seed-designation-hr",
      schoolId: school.id,
      departmentId: adminDept.id,
      name: "HR Officer",
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { id: "seed-academic-year" },
    update: {},
    create: {
      id: "seed-academic-year",
      schoolId: school.id,
      name: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });

  const testClass = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Grade 5" } },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "Grade 5",
      displayName: "Grade 5",
      order: 5,
    },
  });

  const testSection = await prisma.section.upsert({
    where: { classId_name: { classId: testClass.id, name: "A" } },
    update: {},
    create: { schoolId: school.id, classId: testClass.id, name: "A" },
  });

  const testSubject = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: "MATH-5" } },
    update: {},
    create: {
      schoolId: school.id,
      classId: testClass.id,
      name: "Mathematics",
      code: "MATH-5",
      creditHours: 4,
    },
  });

  // ── PRINCIPAL ───────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "principal@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "principal@test.com",
      password: hashedPassword,
      role: UserRole.PRINCIPAL,
    },
  });

  // ── HR (also gets Employee record → doubles as Staff test) ──
  const hrUser = await prisma.user.upsert({
    where: { email: "hr@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "hr@test.com",
      password: hashedPassword,
      role: UserRole.HR,
    },
  });

  const hrEmployee = await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: hrUser.id,
      employeeId: "EMP-HR-001",
      firstName: "Ayesha",
      lastName: "Khan",
      email: "hr@test.com",
      phone: "0300-1111111",
      gender: Gender.FEMALE,
      departmentId: adminDept.id,
      designationId: hrDesignation.id,
      salary: 90000,
    },
  });

  // ── ACCOUNTANT ──────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "accountant@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "accountant@test.com",
      password: hashedPassword,
      role: UserRole.ACCOUNTANT,
    },
  });

  // ── TEACHER ─────────────────────────────────────────────
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "teacher@test.com",
      password: hashedPassword,
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      employeeId: "EMP-TCH-001",
      firstName: "Bilal",
      lastName: "Ahmed",
      email: "teacher@test.com",
      phone: "0300-2222222",
      gender: Gender.MALE,
      departmentId: teachingDept.id,
      designationId: teacherDesignation.id,
    },
  });

  await prisma.teacherSubject.upsert({
    where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: testSubject.id } },
    update: {},
    create: { teacherId: teacher.id, subjectId: testSubject.id },
  });

  // ── STUDENT ─────────────────────────────────────────────
  const studentUser = await prisma.user.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "student@test.com",
      password: hashedPassword,
      role: UserRole.STUDENT,
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: studentUser.id,
      admissionNumber: "STD-2026-001",
      firstName: "Hassan",
      lastName: "Raza",
      dateOfBirth: new Date("2015-04-10"),
      gender: Gender.MALE,
      classId: testClass.id,
      sectionId: testSection.id,
      rollNumber: "05",
    },
  });

  // ── PARENT ──────────────────────────────────────────────
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "parent@test.com",
      password: hashedPassword,
      role: UserRole.PARENT,
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: parentUser.id,
      firstName: "Kamran",
      lastName: "Raza",
      email: "parent@test.com",
      phone: "0300-3333333",
    },
  });

  await prisma.studentParent.upsert({
    where: { studentId_parentId: { studentId: student.id, parentId: parent.id } },
    update: {},
    create: { studentId: student.id, parentId: parent.id, relation: "Father" },
  });

  // ── Sample data so dashboards aren't empty ──────────────
  const existingTimetable = await prisma.timetable.findFirst({
    where: { teacherId: teacher.id, dayOfWeek: getTodayDayOfWeek() },
  });
  if (!existingTimetable) {
    await prisma.timetable.create({
      data: {
        schoolId: school.id,
        classId: testClass.id,
        sectionId: testSection.id,
        subjectId: testSubject.id,
        teacherId: teacher.id,
        dayOfWeek: getTodayDayOfWeek(),
        startTime: "09:00",
        endTime: "09:45",
        room: "Room 12",
      },
    });
  }

  const existingAttendance = await prisma.attendance.findFirst({
    where: { studentId: student.id, date: new Date(new Date().setHours(0, 0, 0, 0)) },
  });
  if (!existingAttendance) {
    await prisma.attendance.create({
      data: {
        schoolId: school.id,
        date: new Date(),
        status: "PRESENT",
        studentId: student.id,
        sectionId: testSection.id,
      },
    });
  }

  await prisma.leave.create({
    data: {
      schoolId: school.id,
      employeeId: hrEmployee.id,
      type: LeaveType.CASUAL,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 86400000),
      totalDays: 2,
      reason: "Personal work",
      status: LeaveStatus.PENDING,
    },
  });

  const feeType = await prisma.feeType.upsert({
    where: { id: "seed-fee-type-tuition" },
    update: {},
    create: {
      id: "seed-fee-type-tuition",
      schoolId: school.id,
      name: "Monthly Tuition Fee",
      amount: 5000,
    },
  });

  await prisma.fee.create({
    data: {
      schoolId: school.id,
      studentId: student.id,
      feeTypeId: feeType.id,
      amount: 5000,
      dueDate: new Date(Date.now() + 5 * 86400000),
      status: FeeStatus.UNPAID,
    },
  });

  await prisma.exam.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classId: testClass.id,
      name: "Mid Term Examination",
      type: ExamType.MID_TERM,
      startDate: new Date(Date.now() + 7 * 86400000),
      endDate: new Date(Date.now() + 10 * 86400000),
      totalMarks: 100,
      passingMarks: 40,
      isPublished: true,
    },
  });

  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: "Welcome to the new academic session",
      content: "Classes resume on schedule. Please check your timetable.",
      targetRoles: [
        UserRole.PRINCIPAL, UserRole.HR, UserRole.ACCOUNTANT,
        UserRole.TEACHER, UserRole.FACULTY, UserRole.STUDENT, UserRole.PARENT,
      ],
    },
  });

  const existingHoliday = await prisma.holiday.findFirst({
    where: { schoolId: school.id, name: "Independence Day" },
  });
  if (!existingHoliday) {
    await prisma.holiday.create({
      data: {
        schoolId: school.id,
        name: "Independence Day",
        date: new Date(new Date().getFullYear(), 7, 14),
      },
    });
  }

  await prisma.payroll.upsert({
    where: {
      employeeId_month_year: {
        employeeId: hrEmployee.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      employeeId: hrEmployee.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 90000,
      allowances: 5000,
      deductions: 2000,
      netSalary: 93000,
    },
  });

  console.log("✅ Role seed complete. Password for all: Test@123");
  console.log("Principal   → principal@test.com");
  console.log("HR + Staff  → hr@test.com");
  console.log("Accountant  → accountant@test.com");
  console.log("Teacher     → teacher@test.com");
  console.log("Student     → student@test.com");
  console.log("Parent      → parent@test.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });