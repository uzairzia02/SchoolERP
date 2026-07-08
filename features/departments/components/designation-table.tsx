"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { DesignationListItem } from "@/features/departments/actions/department.actions";
import {
  deleteDesignationAction,
  toggleDesignationStatusAction,
} from "@/features/departments/actions/department.actions";
import { DesignationFormDialog } from "@/features/departments/components/designation-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tag, MoreHorizontal, Pencil, Trash2,
  ToggleLeft, ToggleRight, Search, Users, GraduationCap,
} from "lucide-react";

interface DesignationTableProps {
  designations: DesignationListItem[];
}

export function DesignationTable({ designations }: DesignationTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = search
    ? designations.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.department?.name.toLowerCase().includes(search.toLowerCase())
      )
    : designations;

  async function handleDelete(desig: DesignationListItem) {
    if (!confirm(`Delete "${desig.name}"?`)) return;
    const result = await deleteDesignationAction(desig.id);
    if (result.success) {
      toast.success("Designation deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle(desig: DesignationListItem) {
    await toggleDesignationStatusAction(desig.id, !desig.isActive);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search designations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <DesignationFormDialog />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No designations found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Designation", "Department", "Teachers", "Employees", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((desig) => (
                  <tr key={desig.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-violet-500" />
                        <div>
                          <p className="font-medium">{desig.name}</p>
                          {desig.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {desig.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {desig.department ? (
                        <div>
                          <p className="text-sm">{desig.department.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {desig.department.code}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">General</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                        {desig._count.teachers}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {desig._count.employees}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={desig.isActive ? "default" : "secondary"}>
                        {desig.isActive ? "Active" : "Inactive"}
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
                            <DesignationFormDialog
                              designation={desig}
                              trigger={
                                <div className="flex items-center px-2 py-1.5 text-sm cursor-pointer">
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(desig)}>
                            {desig.isActive ? (
                              <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                            ) : (
                              <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(desig)}
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
          <div className="border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} designation(s) total
            </p>
          </div>
        </div>
      )}
    </div>
  );
}