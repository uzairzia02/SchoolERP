import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// EDIT THIS: put the email of the user you want to delete
// ─────────────────────────────────────────────────────────────
const EMAIL_TO_DELETE = "ahmedn@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL_TO_DELETE },
    include: {
      student: true,
      teacher: true,
      employee: true,
      parent: true,
    },
  });

  if (!user) {
    console.log(`❌ No user found with email: ${EMAIL_TO_DELETE}`);
    return;
  }

  console.log(`Found user: ${user.email} (role: ${user.role})`);

  await prisma.$transaction(
    async (tx) => {
      // Clear audit log references first (kept, not deleted — just unlinked)
      await tx.auditLog.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      });

      // ── STUDENT: clear every table that references studentId ──
      if (user.student) {
        const studentId = user.student.id;
        console.log("Cleaning up student-related records...");

        await tx.fee.deleteMany({ where: { studentId } });
        await tx.grade.deleteMany({ where: { studentId } });
        await tx.assignmentSubmission.deleteMany({ where: { studentId } });
        await tx.studentAttendance.deleteMany({ where: { studentId } });
        await tx.studentTransport.deleteMany({ where: { studentId } });
        await tx.studentParent.deleteMany({ where: { studentId } });
        await tx.document.deleteMany({ where: { studentId } });
        await tx.notification.deleteMany({ where: { studentId } });

        await tx.student.delete({ where: { id: studentId } });
      }

      // ── TEACHER: clear tables referencing teacherId ──
      if (user.teacher) {
        const teacherId = user.teacher.id;
        console.log("Cleaning up teacher-related records...");

        await tx.teacherSubject.deleteMany({ where: { teacherId } });
        await tx.timetable.deleteMany({ where: { teacherId } });
        await tx.assignment.deleteMany({ where: { teacherId } });
        await tx.staffAttendance.deleteMany({ where: { teacherId } });
        await tx.leave.deleteMany({ where: { teacherId } });

        await tx.teacher.delete({ where: { id: teacherId } });
      }

      // ── EMPLOYEE: clear tables referencing employeeId ──
      if (user.employee) {
        const employeeId = user.employee.id;
        console.log("Cleaning up employee-related records...");

        await tx.payroll.deleteMany({ where: { employeeId } });
        await tx.staffAttendance.deleteMany({ where: { employeeId } });
        await tx.leave.deleteMany({ where: { employeeId } });
        await tx.document.deleteMany({ where: { employeeId } });

        await tx.employee.delete({ where: { id: employeeId } });
      }

      // ── PARENT: clear tables referencing parentId ──
      if (user.parent) {
        const parentId = user.parent.id;
        console.log("Cleaning up parent-related records...");

        await tx.studentParent.deleteMany({ where: { parentId } });

        await tx.parent.delete({ where: { id: parentId } });
      }

      // Finally, delete the user itself
      await tx.user.delete({ where: { id: user.id } });
    },
    { timeout: 20000 } // give it a bit more time for larger cleanups
  );

  console.log(`✅ Successfully deleted user: ${EMAIL_TO_DELETE}`);
}

main()
  .catch((e) => {
    console.error("❌ Delete failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });