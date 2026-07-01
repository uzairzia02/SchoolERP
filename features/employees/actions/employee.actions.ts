"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  employeeSchema,
  employeeUpdateSchema,
  employeeStatusSchema,
} from "@/features/employees/schemas/employee.schema";
import type { ActionResult, PaginatedResponse } from "@/types/globals.types";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type EmployeeListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  salary: number | null;
  isActive: boolean;
  joiningDate: Date;
  lastWorkingDate: Date | null;
  leavingReason: string | null;
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
};

export type EmployeeDetail = EmployeeListItem & {
  gender: string;
  dateOfBirth: Date | null;
  address: string | null;
};

// ─────────────────────────────────────────────────────────────
// Get Employees (paginated + search)
// ─────────────────────────────────────────────────────────────

export async function getEmployees(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}): Promise<PaginatedResponse<EmployeeListItem>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;
  const { page, pageSize, skip } = getPaginationParams(params);

  const where: Prisma.EmployeeWhereInput = {
    schoolId,
    deletedAt: null,
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { employeeId: { contains: params.search, mode: "insensitive" } },
      ],
    }),
    ...(params.departmentId && { departmentId: params.departmentId }),
    ...(params.isActive !== undefined && { isActive: params.isActive }),
  };

  const [data, total] = await Promise.all([
    db.employee.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        employeeId: true,
        salary: true,
        isActive: true,
        joiningDate: true,
        lastWorkingDate: true,
        leavingReason: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    }),
    db.employee.count({ where }),
  ]);

  return buildPaginatedResponse(
    data.map((e) => ({ ...e, salary: e.salary ? Number(e.salary) : null })),
    total,
    page,
    pageSize
  );
}

// ─────────────────────────────────────────────────────────────
// Get Employee by ID
// ─────────────────────────────────────────────────────────────

export async function getEmployeeById(
  id: string
): Promise<ActionResult<EmployeeDetail>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employee = await db.employee.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      employeeId: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      salary: true,
      isActive: true,
      joiningDate: true,
      lastWorkingDate: true,
      leavingReason: true,
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
    },
  });

  if (!employee) {
    return { success: false, error: "Employee not found." };
  }

  return {
    success: true,
    data: {
      ...employee,
      salary: employee.salary ? Number(employee.salary) : null,
    } as EmployeeDetail,
  };
}

// ─────────────────────────────────────────────────────────────
// Create Employee
// ─────────────────────────────────────────────────────────────

export async function createEmployeeAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = employeeSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const existingId = await db.employee.findFirst({
    where: { schoolId, employeeId: data.employeeId, deletedAt: null },
  });
  if (existingId) {
    return {
      success: false,
      error: "Employee ID already exists.",
      fieldErrors: { employeeId: ["This employee ID is already taken."] },
    };
  }

  const existingEmail = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existingEmail) {
    return {
      success: false,
      error: "Email already in use.",
      fieldErrors: { email: ["This email is already registered."] },
    };
  }

  const hashedPassword = await hash("Employee@123", 12);

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          role: "FACULTY",
        },
      });

      const employee = await tx.employee.create({
        data: {
          schoolId,
          userId: user.id,
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: data.address ?? null,
          departmentId: data.departmentId || null,
          designationId: data.designationId || null,
          salary: data.salary ?? null,
          joiningDate: new Date(data.joiningDate),
          createdBy: session.user.id,
        },
      });

      return employee;
    });

    revalidatePath("/dashboard/employees");
    return {
      success: true,
      data: { id: result.id },
      message: "Employee created successfully.",
    };
  } catch (error) {
    console.error("Create employee error:", error);
    return {
      success: false,
      error: "Failed to create employee. Please try again.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Update Employee
// ─────────────────────────────────────────────────────────────

export async function updateEmployeeAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const parsed = employeeUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...data } = parsed.data;

  const employee = await db.employee.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!employee) {
    return { success: false, error: "Employee not found." };
  }

  await db.employee.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      address: data.address ?? null,
      departmentId: data.departmentId || null,
      designationId: data.designationId || null,
      salary: data.salary ?? null,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${id}`);
  return {
    success: true,
    data: { id },
    message: "Employee updated successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Delete Employee (soft delete)
// ─────────────────────────────────────────────────────────────

export async function deleteEmployeeAction(
  id: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.schoolId;

  const employee = await db.employee.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!employee) {
    return { success: false, error: "Employee not found." };
  }

  await db.employee.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/employees");
  return {
    success: true,
    data: null,
    message: "Employee deleted successfully.",
  };
}

// ─────────────────────────────────────────────────────────────
// Update Employee Status (Offboarding)
// ─────────────────────────────────────────────────────────────

export async function updateEmployeeStatusAction(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = employeeStatusSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, isActive, lastWorkingDate, leavingReason } = parsed.data;

  const employee = await db.employee.findFirst({
    where: { id, schoolId: session.user.schoolId, deletedAt: null },
  });
  if (!employee) {
    return { success: false, error: "Employee not found." };
  }

  if (!isActive && !lastWorkingDate) {
    return {
      success: false,
      error: "Last working date is required.",
      fieldErrors: { lastWorkingDate: ["This field is required."] },
    };
  }

  await db.employee.update({
    where: { id },
    data: {
      isActive,
      lastWorkingDate: isActive
        ? null
        : lastWorkingDate
        ? new Date(lastWorkingDate)
        : null,
      leavingReason: isActive ? null : leavingReason || null,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${id}`);
  return {
    success: true,
    data: { id },
    message: isActive ? "Employee marked as active." : "Employee marked as inactive.",
  };
}