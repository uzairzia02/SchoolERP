import { PrismaClient, UserRole, Gender, ExamType, DayOfWeek } from "@prisma/client";
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

  // ── SCHOOL B (deliberately similar names to School A for leak-testing) ──
  const school = await prisma.school.upsert({
    where: { code: "DEMO-002" },
    update: {},
    create: {
      name: "Riverside International School",
      code: "DEMO-002",
      email: "school@riverside-demo.com",
      phone: "0300-9999999",
      address: "456 River Road",
      city: "Lahore",
      state: "Punjab",
      country: "Pakistan",
      zipCode: "54000",
      currency: "PKR",
      timezone: "Asia/Karachi",
    },
  });

  const teachingDept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: "TEACH" } },
    update: {},
    create: { schoolId: school.id, name: "Teaching Staff", code: "TEACH" },
  });

  const teacherDesignation = await prisma.designation.upsert({
    where: { id: "seed-b-designation-teacher" },
    update: {},
    create: {
      id: "seed-b-designation-teacher",
      schoolId: school.id,
      departmentId: teachingDept.id,
      name: "Subject Teacher",
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { id: "seed-b-academic-year" },
    update: {},
    create: {
      id: "seed-b-academic-year",
      schoolId: school.id,
      name: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });

  // Deliberately SAME class name ("Grade 5") as School A — this is the point:
  // if isolation is broken, you'll see cross-contamination between these.
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

  // ── PRINCIPAL (School B) ──
  await prisma.user.upsert({
    where: { email: "principal-b@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "principal-b@test.com",
      password: hashedPassword,
      role: UserRole.PRINCIPAL,
    },
  });

  // ── TEACHER (School B) ──
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher-b@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "teacher-b@test.com",
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
      employeeId: "EMP-TCH-B01",
      firstName: "Sara",
      lastName: "Malik",
      email: "teacher-b@test.com",
      phone: "0300-8888888",
      gender: Gender.FEMALE,
      departmentId: teachingDept.id,
      designationId: teacherDesignation.id,
    },
  });

  await prisma.teacherSubject.upsert({
    where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: testSubject.id } },
    update: {},
    create: { teacherId: teacher.id, subjectId: testSubject.id },
  });

  // ── STUDENT (School B) — deliberately similar name pattern to School A's student ──
  const studentUser = await prisma.user.upsert({
    where: { email: "student-b@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "student-b@test.com",
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
      admissionNumber: "STD-2026-001", // SAME admission number as School A on purpose
      firstName: "Zainab",
      lastName: "Sheikh",
      dateOfBirth: new Date("2015-06-15"),
      gender: Gender.FEMALE,
      classId: testClass.id,
      sectionId: testSection.id,
      rollNumber: "05", // SAME roll number as School A on purpose
    },
  });

  // ── PARENT (School B) ──
  const parentUser = await prisma.user.upsert({
    where: { email: "parent-b@test.com" },
    update: {},
    create: {
      schoolId: school.id,
      email: "parent-b@test.com",
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
      firstName: "Imran",
      lastName: "Sheikh",
      email: "parent-b@test.com",
      phone: "0300-7777777",
    },
  });

  await prisma.studentParent.upsert({
    where: { studentId_parentId: { studentId: student.id, parentId: parent.id } },
    update: {},
    create: { studentId: student.id, parentId: parent.id, relation: "Father" },
  });

  // Sample assignment + attendance so School B has non-empty data to compare against
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
        startTime: "10:00",
        endTime: "10:45",
        room: "B-Room 3",
      },
    });
  }

  await prisma.assignment.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.id,
      subjectId: testSubject.id,
      classId: testClass.id,
      title: "School B Only — Fractions Worksheet",
      description: "This assignment should NEVER appear in School A's account.",
      dueDate: new Date(Date.now() + 5 * 86400000),
      totalMarks: 20,
    },
  });

  console.log("✅ School B seeded. Password for all: Test@123");
  console.log("Principal → principal-b@test.com");
  console.log("Teacher   → teacher-b@test.com");
  console.log("Student   → student-b@test.com");
  console.log("Parent    → parent-b@test.com");
  console.log("");
  console.log("⚠️  Note: this school shares the same class name (Grade 5),");
  console.log("   admission number (STD-2026-001), and roll number (05) as");
  console.log("   School A on purpose — use this to catch cross-tenant leaks.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
