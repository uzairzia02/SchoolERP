import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTimetable } from "@/features/timetable/actions/timetable.actions";
import { TimetableGrid } from "@/features/timetable/components/timetable-grid";
import { AddSlotForm } from "@/features/timetable/components/add-slot-form";
import { getClassesForSelect } from "@/features/students/actions/student.actions";
import { Calendar } from "lucide-react";
import type { UserRole } from "@prisma/client";

export const metadata: Metadata = { title: "Timetable" };

interface PageProps {
  searchParams: Promise<{ classId?: string; sectionId?: string }>;
}

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "PRINCIPAL", "HR"];

export default async function TimetablePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const schoolId = session.user.schoolId;
  const role = session.user.role as UserRole;
  const canEdit = ADMIN_ROLES.includes(role);

  const classes = await getClassesForSelect();

  let selectedClassId = params.classId ?? classes[0]?.id ?? "";
  let selectedSectionId = params.sectionId;

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

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <form className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Class</label>
            <select
              name="classId"
              defaultValue={selectedClassId}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set("classId", e.target.value);
                url.searchParams.delete("sectionId");
                window.location.href = url.toString();
              }}
              className="flex h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
          </div>

          {sections.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Section</label>
              <select
                name="sectionId"
                defaultValue={selectedSectionId ?? ""}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("sectionId", e.target.value);
                  window.location.href = url.toString();
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </div>

      <TimetableGrid
        timetable={timetable}
        canEdit={canEdit}
        showTeacher={true}
        showClass={false}
      />
    </div>
  );
}