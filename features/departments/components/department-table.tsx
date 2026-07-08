"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import type { DepartmentListItem } from "@/features/departments/actions/department.actions";
import {
  deleteDepartmentAction,
  toggleDepartmentStatusAction,
} from "@/features/departments/actions/department.actions";
import { DepartmentFormDialog } from "@/features/departments/components/department-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2, MoreHorizontal, Eye, Pencil,
  Trash2, ToggleLeft, ToggleRight, Users,
  Tag, GraduationCap,
} from "lucide-react";

interface DepartmentTableProps {
  departments: DepartmentListItem[];
}

export function DepartmentTable({ departments }: DepartmentTableProps) {
  const router = useRouter();

  async function handleDelete(dept: DepartmentListItem) {
    if (!confirm(`Delete "${dept.name}"?`)) return;
    const result = await deleteDepartmentAction(dept.id);
    if (result.success) {
      toast.success("Department deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle(dept: DepartmentListItem) {
    await toggleDepartmentStatusAction(dept.id, !dept.isActive);
    router.refresh();
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No departments yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Run the seed script or add departments manually
        </p>
        <DepartmentFormDialog />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["Department", "Code", "Teachers", "Employees", "Designations", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/departments/${dept.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {dept.name}
                      </Link>
                      {dept.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    {dept._count.teachers}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {dept._count.employees}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {dept._count.designations}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={dept.isActive ? "default" : "secondary"}>
                    {dept.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/departments/${dept.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <DepartmentFormDialog
                          department={dept}
                          trigger={
                            <div className="flex items-center px-2 py-1.5 text-sm cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </div>
                          }
                        />
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(dept)}>
                        {dept.isActive ? (
                          <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                        ) : (
                          <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(dept)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}