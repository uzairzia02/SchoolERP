"use client";

import { useState, useTransition, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { employeeColumns } from "@/features/employees/components/employee-columns";
import type { EmployeeListItem } from "@/features/employees/actions/employee.actions";
import type { PaginatedResponse } from "@/types/globals.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface EmployeeTableProps {
  initialData: PaginatedResponse<EmployeeListItem>;
}

export function EmployeeTable({ initialData }: EmployeeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const table = useReactTable({
    data: initialData.data,
    columns: employeeColumns,
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
            placeholder="Search employees..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/employees/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
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
                  <td
                    colSpan={employeeColumns.length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-medium text-muted-foreground">
                        No employees found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add your first employee to get started
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href="/dashboard/employees/new">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Employee
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
            Showing {initialData.data.length} of {initialData.total} employees
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