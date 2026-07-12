import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTimetable } from "@/features/timetable/actions/timetable.actions";
import { TimetableGrid } from "@/features/timetable/components/timetable-grid";
import { TimetableFilters } from "@/features/timetable/components/timetable-filters";
import { AddSlotForm } from "@/features/timetable/components/add-slot-form";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { Calendar } from "lucide-react";
import type { UserRole } from "@prisma/client";

export const metadata: Metadata = { title: "Timetable" };

interface PageProps {
  searchParams: Promise<{ classId?: string; sectionId?: string }>;
}

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "PRINCIPAL", "HR"];
const VIEW_ROLES: UserRole[] = ["SUPER_ADMIN", "PRINCIPAL", "HR", "TEACHER", "FACULTY", "STUDENT"];

export default async function TimetablePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!VIEW_ROLES.includes(session.user.role as UserRole)) redirect("/login");

  const params = await searchParams;
  const schoolId = session.user.schoolId;
  const role = session.user.role as UserRole;
  const canEdit = ADMIN_ROLES.includes(role);

  const classes = await getClassesForSelect();

  const selectedClassId = params.classId ?? classes[0]?.id ?? "";
  const selectedSectionId = params.sectionId;

  const sections = selectedClassId
    ? await db.section.findMany({
        where: { classId: selectedClassId, schoolId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const timetable = await getTimetable({
    classId: selectedClassId || undefined,
    sectionId: selectedSectionId,
  });

  const teachers = canEdit
    ? await db.teacher.findMany({
        where: { schoolId, isActive: true, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" },
      })
    : [];

  const totalPeriods = Object.values(timetable).flat().length;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Timetable</h1>
            <p className="text-sm text-muted-foreground">
              Weekly class schedule — {totalPeriods} periods configured
            </p>
          </div>
        </div>
        {canEdit && <AddSlotForm teachers={teachers} />}
      </div>

      <TimetableFilters
        classes={classes}
        sections={sections}
        selectedClassId={selectedClassId}
        selectedSectionId={selectedSectionId}
      />

      <TimetableGrid
        timetable={timetable}
        canEdit={canEdit}
        showTeacher={true}
        showClass={false}
      />
    </div>
  );
}
