"use client";

import { useState, useTransition, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ParentListItem } from "@/features/parents/actions/parent.actions";
import { toggleParentStatusAction } from "@/features/parents/actions/parent.actions";
import type { PaginatedResponse } from "@/types/globals.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  Users2, Eye, MoreHorizontal, ToggleLeft, ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface ParentTableProps {
  initialData: PaginatedResponse<ParentListItem>;
}

export function ParentTable({ initialData }: ParentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  async function handleToggle(parent: ParentListItem) {
    const result = await toggleParentStatusAction(parent.id, !parent.isActive);
    if (result.success) {
      toast.success(`Parent ${parent.isActive ? "deactivated" : "activated"}.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<ParentListItem>[] = [
    {
      accessorKey: "name",
      header: "Parent",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-600">
              {getInitials(`${p.firstName} ${p.lastName}`)}
            </div>
            <div>
              <p className="font-medium text-sm">
                {p.firstName} {p.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: "occupation",
      header: "Occupation",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.occupation ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "students",
      header: "Children",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
          {row.original._count.students}
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
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const parent = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/parents/${parent.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggle(parent)}>
                {parent.isActive ? (
                  <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                ) : (
                  <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parents..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          defaultValue={searchParams.get("isActive") ?? ""}
          onChange={(e) => {
            startTransition(() => {
              router.push(
                `${pathname}?${createQueryString({
                  isActive: e.target.value || null,
                  page: 1,
                })}`
              );
            });
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                      <Users2 className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">
                        No parents found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parents are created automatically when students are enrolled
                      </p>
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
            Showing {initialData.data.length} of {initialData.total} parents
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