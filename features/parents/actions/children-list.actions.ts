"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getParentChildrenList() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              class: { select: { displayName: true } },
              section: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!parent) return null;

  return parent.students.map(({ student, relation }) => ({
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    className: student.class?.displayName ?? "N/A",
    sectionName: student.section?.name ?? "N/A",
    relation,
  }));
}