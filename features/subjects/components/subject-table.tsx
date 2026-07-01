"use client";

import { useState, useTransition, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { SubjectListItem } from "@/features/subjects/actions/subject.actions";
import type { PaginatedResponse } from "@/types/globals.types";
import { deleteSubjectAction } from "@/features/subjects/actions/subject.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, ChevronLeft, ChevronRight,
  Loader2, MoreHorizontal, Eye, Pencil, Trash2,
  BookOpen, Users, Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

function ActionsCell({ subject }: { subject: SubjectListItem }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${subject.name}"? This cannot be undone.`)) return;
    const result = await deleteSubjectAction(subject.id);
    if (result.success) {
      toast.success("Subject deleted.");
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
          <Link href={`/dashboard/subjects/${subject.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/subjects/${subject.id}/edit`}>
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

const columns: ColumnDef<SubjectListItem>[] = [
  {
    accessorKey: "name",
    header: "Subject",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <BookOpen className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{s.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "class",
    header: "Class",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.class?.displayName ?? (
          <span className="text-muted-foreground">All Classes</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "creditHours",
    header: "Credit Hours",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.creditHours}</span>
    ),
  },
  {
    accessorKey: "teachers",
    header: "Teachers",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        {row.original._count.teachers}
      </div>
    ),
  },
  {
    accessorKey: "grades",
    header: "Grades",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Star className="h-3.5 w-3.5 text-muted-foreground" />
        {row.original._count.grades}
      </div>
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
    id: "actions",
    cell: ({ row }) => <ActionsCell subject={row.original} />,
  },
];

interface SubjectTableProps {
  initialData: PaginatedResponse<SubjectListItem>;
}

export function SubjectTable({ initialData }: SubjectTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const table = useReactTable({
    data: initialData.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: initialData.totalPages,
  });

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) current.delete(key);
        else current.set(key, String(value));
      });
      return current.toString();
    },
    [searchParams]
  );

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ search: value || null, page: 1 })}`
      );
    });
  }

  function handlePage(page: number) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ page })}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/subjects/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isPending && (
          <div className="flex items-center justify-center gap-2 border-b bg-muted/30 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b bg-muted/30">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">No subjects found</p>
                      <p className="text-xs text-muted-foreground">
                        Add your first subject to get started
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href="/dashboard/subjects/new">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Subject
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {initialData.data.length} of {initialData.total} subjects
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(initialData.page - 1)}
              disabled={!initialData.hasPrev || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {initialData.page} of {initialData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(initialData.page + 1)}
              disabled={!initialData.hasNext || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}