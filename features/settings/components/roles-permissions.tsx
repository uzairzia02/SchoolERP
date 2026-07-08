import type { UserRole } from "@prisma/client";
import { ROLE_PERMISSIONS } from "@/config/roles.config";
import { USER_ROLE_LABELS } from "@/constants/enums";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PERMISSION_GROUPS = [
  {
    group: "Students",
    permissions: ["students:view", "students:create", "students:edit", "students:delete"],
  },
  {
    group: "Teachers",
    permissions: ["teachers:view", "teachers:create", "teachers:edit", "teachers:delete"],
  },
  {
    group: "Employees",
    permissions: ["employees:view", "employees:create", "employees:edit", "employees:delete"],
  },
  {
    group: "Attendance",
    permissions: ["attendance:view", "attendance:mark", "attendance:edit", "attendance:export"],
  },
  {
    group: "Exams & Grades",
    permissions: ["exams:view", "exams:create", "grades:view", "grades:enter", "grades:publish"],
  },
  {
    group: "Fees",
    permissions: ["fees:view", "fees:create", "fees:collect", "fees:edit"],
  },
  {
    group: "Payroll",
    permissions: ["payroll:view", "payroll:create", "payroll:process"],
  },
  {
    group: "Leaves",
    permissions: ["leaves:view", "leaves:apply", "leaves:approve"],
  },
  {
    group: "Admissions",
    permissions: ["admissions:view", "admissions:create", "admissions:review", "admissions:decide"],
  },
  {
    group: "Reports",
    permissions: ["reports:view", "reports:export"],
  },
  {
    group: "Settings",
    permissions: ["settings:view", "settings:edit", "audit:view"],
  },
];

const ROLES: UserRole[] = [
  "SUPER_ADMIN", "PRINCIPAL", "HR", "ACCOUNTANT", "TEACHER", "FACULTY",
];

export function RolesPermissions() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold font-display">Roles & Permissions Matrix</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Read-only view of what each role can do. Permissions are configured in code for security.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-3 text-left font-medium text-muted-foreground sticky left-0 bg-card">
                  Permission
                </th>
                {ROLES.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-medium">
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                      {USER_ROLE_LABELS[role]}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <>
                  <tr key={`group-${group.group}`} className="bg-muted/30">
                    <td
                      colSpan={ROLES.length + 1}
                      className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.permissions.map((permission) => (
                    <tr key={permission} className="border-b last:border-0 hover:bg-muted/10">
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground sticky left-0 bg-card">
                        {permission}
                      </td>
                      {ROLES.map((role) => {
                        const hasIt = ROLE_PERMISSIONS[role]?.includes(permission as any);
                        return (
                          <td key={role} className="px-3 py-2 text-center">
                            {hasIt ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}