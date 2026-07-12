"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getSchoolBankDetails() {
  const session = await auth();
  if (!session?.user) return null;

  const school = await db.school.findUnique({
    where: { id: session.user.schoolId },
    include: { settings: true },
  });

  if (!school) return null;

  return {
    schoolName: school.name,
    bankName: school.settings?.bankName ?? null,
    bankAccountNumber: school.settings?.bankAccountNumber ?? null,
    bankBranch: school.settings?.bankBranch ?? null,
  };
}
