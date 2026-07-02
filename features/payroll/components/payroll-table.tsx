"use client";

import { useState, useTransition, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { PayrollListItem } from "@/features/payroll/actions/payroll.actions";
import type { PaginatedResponse } from "@/types/globals.types";
import { deletePayrollAction } from "@/features/payroll/actions/payroll.actions";
import { ProcessPayrollForm } from "@/features/payroll/components/process-payroll-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  Banknote, Trash2, CheckCircle,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface PayrollTableProps {
  initialData: PaginatedResponse<PayrollListItem>;
  selectedMonth: number;
  selectedYear: number;
}

export function PayrollTable({
  initialData,
  selectedMonth,
  selectedYear,
}: PayrollTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [processingEmployee, setProcessingEmployee] = useState<PayrollListItem["employee"] & { salary: number | null } | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this payroll record?")) return;
    const result = await deletePayrollAction(id);
    if (result.success) {
      toast.success("Payroll record deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<PayrollListItem>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-600">
              {getInitials(`${p.employee.firstName} ${p.employee.lastName}`)}
            </div>
            <div>
              <p className="font-medium text-sm">
                {p.employee.firstName} {p.employee.lastName}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {p.employee.employeeId}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.employee.department?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => (
        <span className="text-sm">
          {MONTHS[row.original.month - 1]} {row.original.year}
        </span>
      ),
    },
    {
      accessorKey: "basicSalary",
      header: "Basic",
      cell: ({ row }) => (
        <span className="text-sm">{formatCurrency(row.original.basicSalary)}</span>
      ),
    },
    {
      accessorKey: "allowances",
      header: "Allow.",
      cell: ({ row }) => (
        <span className="text-sm text-emerald-600">
          +{formatCurrency(row.original.allowances)}
        </span>
      ),
    },
    {
      accessorKey: "deductions",
      header: "Deduct.",
      cell: ({ row }) => (
        <span className="text-sm text-red-600">
          -{formatCurrency(row.original.deductions)}
        </span>
      ),
    },
    {
      accessorKey: "netSalary",
      header: "Net Salary",
      cell: ({ row }) => (
        <span className="text-sm font-bold">
          {formatCurrency(row.original.netSalary)}
        </span>
      ),
    },
    {
      accessorKey: "paidDate",
      header: "Paid On",
      cell: ({ row }) =>
        row.original.paidDate ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-muted-foreground">
              {formatDate(row.original.paidDate)}
            </span>
          </div>
        ) : (
          <Badge variant="secondary" className="text-[10px]">Pending</Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => handleDelete(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
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

  function handleMonthYear(month: number, year: number) {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ month, year, page: 1 })}`
      );
    });
  }

  function handlePage(page: number) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ page })}`);
    });
  }

  return (
    <>
      {processingEmployee && (
        <ProcessPayrollForm
          employee={processingEmployee}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setProcessingEmployee(null)}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthYear(Number(e.target.value), selectedYear)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => handleMonthYear(selectedMonth, Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
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
                        <Banknote className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">
                          No payroll records found
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Process payroll from the Process tab
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
              Showing {initialData.data.length} of {initialData.total} records
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
    </>
  );
}