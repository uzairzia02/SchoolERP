"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { StudentListItem } from "@/features/students/actions/student.actions";
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
import { deleteStudentAction } from "@/features/students/actions/student.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function ActionsCell({ student }: { student: StudentListItem }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)) return;
    const result = await deleteStudentAction(student.id);
    if (result.success) {
      toast.success("Student deleted successfully.");
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
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/students/${student.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/students/${student.id}/edit`}>
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

export const studentColumns: ColumnDef<StudentListItem>[] = [
  {
    accessorKey: "name",
    header: "Student",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(`${s.firstName} ${s.lastName}`)}
          </div>
          <div>
            <p className="font-medium text-sm">
              {s.firstName} {s.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{s.user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "admissionNumber",
    header: "Admission #",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.admissionNumber}</span>
    ),
  },
  {
    accessorKey: "class",
    header: "Class",
    cell: ({ row }) => {
      const s = row.original;
      if (!s.class) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm">
          {s.class.name}
          {s.section && ` - ${s.section.name}`}
        </span>
      );
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (
      <span className="text-sm capitalize">
        {row.original.gender.toLowerCase()}
      </span>
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
    accessorKey: "createdAt",
    header: "Admitted",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell student={row.original} />,
  },
];