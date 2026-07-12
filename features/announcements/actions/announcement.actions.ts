"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { UserRole, Prisma } from "@prisma/client";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  targetRoles: z.array(z.string()).min(1, "Select at least one target audience"),
  isActive: z.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AnnouncementListItem = {
  id: string;
  title: string;
  content: string;
  targetRoles: UserRole[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
};

// ─────────────────────────────────────────────────────────────
// Get Announcements
// ─────────────────────────────────────────────────────────────

export async function getAnnouncements(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  role?: UserRole;
}): Promise<PaginatedResponse<AnnouncementListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.AnnouncementWhereInput = {
    schoolId,
    ...(params.isActive !== undefined && { isActive: params.isActive }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: "insensitive" } },
        { content: { contains: params.search, mode: "insensitive" } },
      ],
    }),
    ...(params.role && {
      targetRoles: { has: params.role },
    }),
  };

  const [data, total] = await Promise.all([
    db.announcement.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        targetRoles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    }),
    db.announcement.count({ where }),
  ]);

  return buildPaginatedResponse(data as AnnouncementListItem[], total, page, pageSize);
}

// ─────────────────────────────────────────────────────────────
// Create Announcement
// ─────────────────────────────────────────────────────────────

export async function createAnnouncementAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = announcementSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const announcement = await db.announcement.create({
    data: {
      schoolId,
      title: parsed.data.title,
      content: parsed.data.content,
      targetRoles: parsed.data.targetRoles as UserRole[],
      isActive: parsed.data.isActive,
      createdBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/announcements");
  return {
    success: true,
    data: { id: announcement.id },
    message: "Announcement published successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Update Announcement
// ─────────────────────────────────────────────────────────────

const updateAnnouncementSchema = announcementSchema.extend({
  id: z.string().min(1),
});

export async function updateAnnouncementAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = updateAnnouncementSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  await db.announcement.update({
    where: { id, schoolId: session.user.schoolId },
    data: {
      title: data.title,
      content: data.content,
      targetRoles: data.targetRoles as UserRole[],
      isActive: data.isActive,
    },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, data: { id }, message: "Announcement updated." };
}

// ─────────────────────────────────────────────────────────────
// Toggle Status
// ─────────────────────────────────────────────────────────────

export async function toggleAnnouncementAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.announcement.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────
// Delete Announcement
// ─────────────────────────────────────────────────────────────

export async function deleteAnnouncementAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL"]);
  if (!session?.user) redirect("/login");

  await db.announcement.delete({
    where: { id, schoolId: session.user.schoolId },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, data: null, message: "Announcement deleted." };
}