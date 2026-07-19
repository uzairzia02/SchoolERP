"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getPeriodsForSelect() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return db.period.findMany({
    where: {
      schoolId: session.user.schoolId,
      isActive: true,
    },
    orderBy: {
      periodNo: "asc",
    },
    select: {
      id: true,
      name: true,
      periodNo: true,
      startTime: true,
      endTime: true,
    },
  });
}