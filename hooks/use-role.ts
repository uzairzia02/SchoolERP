"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission, hasAnyPermission, type Permission } from "@/config/roles.config";
import type { UserRole } from "@prisma/client";

export function useRole() {
  const user = useCurrentUser();
  const role = user?.role as UserRole | undefined;

  return {
    role,
    isRole: (r: UserRole) => role === r,
    can: (permission: Permission) =>
      role ? hasPermission(role, permission) : false,
    canAny: (permissions: Permission[]) =>
      role ? hasAnyPermission(role, permissions) : false,
    isSuperAdmin: role === "SUPER_ADMIN",
    isPrincipal: role === "PRINCIPAL",
    isHR: role === "HR",
    isAccountant: role === "ACCOUNTANT",
    isTeacher: role === "TEACHER",
    isFaculty: role === "FACULTY",
    isStudent: role === "STUDENT",
    isParent: role === "PARENT",
    isStaff:
      role === "SUPER_ADMIN" ||
      role === "PRINCIPAL" ||
      role === "HR" ||
      role === "ACCOUNTANT" ||
      role === "TEACHER" ||
      role === "FACULTY",
  };
}