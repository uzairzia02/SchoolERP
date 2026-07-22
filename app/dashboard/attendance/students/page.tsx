import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ClipboardCheck } from "lucide-react";
import { getClassesForSelect, getSectionsForSelect } from "@/features/students/actions/student.actions";
import {
  getStudentsForAttendance,
  getAttendanceSummary,
} from "@/features/attendance/actions/attendance.actions";
import { StudentAttendanceClient } from "@/features/attendance/components/student-attendance";

export const metadata: Metadata = { title: "Student Attendance" };

interface PageProps {
  searchParams: Promise<{
    date?: string;
    classId?: string;
    sectionId?: string;
  }>;
}

export default async function StudentAttendancePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const schoolId = session.user.schoolId;
  const isTeacher = role === "TEACHER" || role === "FACULTY";

  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params.date ?? today;
  const selectedClassId = params.classId ?? "";
  const selectedSectionId = params.sectionId ?? "";

  let classes = await getClassesForSelect();

  if (isTeacher) {
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id, schoolId, deletedAt: null },
      select: { id: true },
    });

    if (!teacher) redirect("/dashboard/teacher");

    const timetableEntries = await db.timetable.findMany({
      where: { teacherId: teacher.id, schoolId, isActive: true },
      select: { classId: true },
      distinct: ["classId"],
    });

    const allowedClassIds = new Set(timetableEntries.map((t) => t.classId));
    classes = classes.filter((c) => allowedClassIds.has(c.id));

    // Agar Teacher ne kisi aisi class ka URL try kiya jo uski nahi hai, block karo
    if (selectedClassId && !allowedClassIds.has(selectedClassId)) {
      redirect("/dashboard/attendance/students");
    }
  }

  const sections = selectedClassId
    ? await getSectionsForSelect(selectedClassId)
    : [];

  const studentsResult = selectedClassId
    ? await getStudentsForAttendance({
        classId: selectedClassId,
        sectionId: selectedSectionId || undefined,
        date: selectedDate,
      })
    : { success: true as const, data: [] };

  const summary = selectedClassId
    ? await getAttendanceSummary({
        classId: selectedClassId,
        sectionId: selectedSectionId || undefined,
        date: selectedDate,
      })
    : { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, total: 0, percentage: 0 };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">
            {isTeacher ? "My Class Attendance" : "Student Attendance"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Mark daily student attendance
          </p>
        </div>
      </div>

      <StudentAttendanceClient
        classes={classes}
        sections={sections}
        students={studentsResult.success ? studentsResult.data : []}
        summary={summary}
        selectedClassId={selectedClassId}
        selectedSectionId={selectedSectionId}
        selectedDate={selectedDate}
      />
    </div>
  );
}