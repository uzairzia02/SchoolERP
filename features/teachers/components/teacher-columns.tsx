"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TeacherListItem } from "@/features/teachers/actions/teacher.actions";
import { formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTeacherAction } from "@/features/teachers/actions/teacher.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function ActionsCell({ teacher }: { teacher: TeacherListItem }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete ${teacher.firstName} ${teacher.lastName}? This cannot be undone.`)) return;
    const result = await deleteTeacherAction(teacher.id);
    if (result.success) {
      toast.success("Teacher deleted successfully.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/teachers/${teacher.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const teacherColumns: ColumnDef<TeacherListItem>[] = [
  {
    accessorKey: "name",
    header: "Teacher",
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
            {getInitials(`${t.firstName} ${t.lastName}`)}
          </div>
          <div>
            <p className="font-medium text-sm">
              {t.firstName} {t.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{t.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "employeeId",
    header: "Employee ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.employeeId}</span>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.department?.name ?? "—"}</span>
    ),
  },
  {
    accessorKey: "designation",
    header: "Designation",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.designation?.name ?? "—"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.phone}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "joiningDate",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.joiningDate)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell teacher={row.original} />,
  },
];