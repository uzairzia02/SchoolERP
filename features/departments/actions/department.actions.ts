"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types/globals.types";
import { requireRoles } from "@/lib/auth-guards";

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().optional(),
});

const departmentUpdateSchema = departmentSchema.partial().extend({
  id: z.string().min(1),
});

const designationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  departmentId: z.string().optional(),
});

const designationUpdateSchema = designationSchema.partial().extend({
  id: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type DepartmentListItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    teachers: number;
    employees: number;
    designations: number;
  };
};

export type DepartmentDetail = DepartmentListItem & {
  designations: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    _count: { teachers: number; employees: number };
  }[];
  teachers: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    designation: { name: string } | null;
  }[];
  employees: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    designation: { name: string } | null;
  }[];
};

export type DesignationListItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  department: { id: string; name: string; code: string } | null;
  _count: { teachers: number; employees: number };
};

// ─────────────────────────────────────────────────────────────
// Get Departments
// ─────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<DepartmentListItem[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const departments = await db.department.findMany({
    where: { schoolId: session.user.schoolId, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          teachers: { where: { deletedAt: null } },
          employees: { where: { deletedAt: null } },
          designations: { where: { deletedAt: null } },
        },
      },
    },
  });

  return departments;
}

// ─────────────────────────────────────────────────────────────
// Get Department by ID
// ─────────────────────────────────────────────────────────────

export async function getDepartmentById(
  id: string
): Promise<ActionResult<DepartmentDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const dept = await db.department.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          teachers: { where: { deletedAt: null } },
          employees: { where: { deletedAt: null } },
          designations: { where: { deletedAt: null } },
        },
      },
      designations: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          _count: {
            select: {
              teachers: { where: { deletedAt: null } },
              employees: { where: { deletedAt: null } },
            },
          },
        },
      },
      teachers: {
        where: { deletedAt: null, isActive: true },
        orderBy: { firstName: "asc" },
        take: 20,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          designation: { select: { name: true } },
        },
      },
      employees: {
        where: { deletedAt: null, isActive: true },
        orderBy: { firstName: "asc" },
        take: 20,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          designation: { select: { name: true } },
        },
      },
    },
  });

  if (!dept) return { success: false, error: "Department not found." };

  return { success: true, data: dept as DepartmentDetail };
}

// ─────────────────────────────────────────────────────────────
// Create Department
// ─────────────────────────────────────────────────────────────

export async function createDepartmentAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = departmentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.department.findFirst({
    where: { schoolId, code: parsed.data.code, deletedAt: null },
  });
  if (existing) {
    return {
      success: false,
      error: "Department code already exists.",
      fieldErrors: { code: ["This code is already taken."] },
    };
  }

  const dept = await db.department.create({
    data: { schoolId, ...parsed.data },
  });

  revalidatePath("/dashboard/departments");
  return {
    success: true,
    data: { id: dept.id },
    message: "Department created successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Update Department
// ─────────────────────────────────────────────────────────────

export async function updateDepartmentAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = departmentUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  await db.department.update({ where: { id }, data });

  revalidatePath("/dashboard/departments");
  revalidatePath(`/dashboard/departments/${id}`);
  return {
    success: true,
    data: { id },
    message: "Department updated successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Delete Department
// ─────────────────────────────────────────────────────────────

export async function deleteDepartmentAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  if (!session?.user) redirect("/login");

  const dept = await db.department.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      _count: {
        select: {
          teachers: { where: { deletedAt: null } },
          employees: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!dept) return { success: false, error: "Department not found." };

  const total = dept._count.teachers + dept._count.employees;
  if (total > 0) {
    return {
      success: false,
      error: `Cannot delete — ${total} staff member(s) belong to this department.`,
    };
  }

  await db.department.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/dashboard/departments");
  return { success: true, data: null, message: "Department deleted." };
}

// ─────────────────────────────────────────────────────────────
// Toggle Department Status
// ─────────────────────────────────────────────────────────────

export async function toggleDepartmentStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  if (!session?.user) redirect("/login");

  await db.department.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/departments");
  return { success: true, data: null };
}

// ─────────────────────────────────────────────────────────────
// Get Designations
// ─────────────────────────────────────────────────────────────

export async function getDesignations(params?: {
  departmentId?: string;
}): Promise<DesignationListItem[]> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const designations = await db.designation.findMany({
    where: {
      schoolId: session.user.schoolId,
      deletedAt: null,
      ...(params?.departmentId && { departmentId: params.departmentId }),
    },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      department: { select: { id: true, name: true, code: true } },
      _count: {
        select: {
          teachers: { where: { deletedAt: null } },
          employees: { where: { deletedAt: null } },
        },
      },
    },
  });

  return designations;
}

// ─────────────────────────────────────────────────────────────
// Create Designation
// ─────────────────────────────────────────────────────────────

export async function createDesignationAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  if (!session?.user) redirect("/login");

  const parsed = designationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const desig = await db.designation.create({
    data: {
      schoolId: session.user.schoolId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      departmentId: parsed.data.departmentId || null,
    },
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/dashboard/designations");
  return {
    success: true,
    data: { id: desig.id },
    message: "Designation created successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Update Designation
// ─────────────────────────────────────────────────────────────

export async function updateDesignationAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  if (!session?.user) redirect("/login");

  const parsed = designationUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  await db.designation.update({
    where: { id, schoolId: session.user.schoolId },
    data: {
      name: data.name,
      description: data.description ?? null,
      departmentId: data.departmentId || null,
    },
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/dashboard/designations");
  return {
    success: true,
    data: { id },
    message: "Designation updated.",
  };
}

// ─────────────────────────────────────────────────────────────
// Delete Designation
// ─────────────────────────────────────────────────────────────

export async function deleteDesignationAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  if (!session?.user) redirect("/login");

  const desig = await db.designation.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      _count: {
        select: {
          teachers: { where: { deletedAt: null } },
          employees: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!desig) return { success: false, error: "Designation not found." };

  const total = desig._count.teachers + desig._count.employees;
  if (total > 0) {
    return {
      success: false,
      error: `Cannot delete — ${total} staff member(s) have this designation.`,
    };
  }

  await db.designation.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/dashboard/designations");
  return { success: true, data: null, message: "Designation deleted." };
}

// ─────────────────────────────────────────────────────────────
// Toggle Designation Status
// ─────────────────────────────────────────────────────────────

export async function toggleDesignationStatusAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  const session = await auth();
  await requireRoles(["SUPER_ADMIN", "PRINCIPAL", "HR"]);
  if (!session?.user) redirect("/login");

  await db.designation.update({
    where: { id, schoolId: session.user.schoolId },
    data: { isActive },
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/dashboard/designations");
  return { success: true, data: null };
}