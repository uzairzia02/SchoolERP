"use client";

import { useState, useTransition, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { FeeListItem } from "@/features/fees/actions/fee.actions";
import type { PaginatedResponse } from "@/types/globals.types";
import { CollectFeeForm } from "@/features/fees/components/collect-fee-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, ChevronLeft, ChevronRight, Loader2, CreditCard,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { FeeStatus } from "@prisma/client";

const STATUS_COLORS: Record<FeeStatus, string> = {
  PAID: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  UNPAID: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  PARTIAL: "bg-blue-500/10 text-blue-700 border-blue-200",
  WAIVED: "bg-gray-500/10 text-gray-700 border-gray-200",
  OVERDUE: "bg-red-500/10 text-red-700 border-red-200",
};

function FeeStatusBadge({ status }: { status: FeeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

interface FeeTableProps {
  initialData: PaginatedResponse<FeeListItem>;
}

export function FeeTable({ initialData }: FeeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [collectingFee, setCollectingFee] = useState<FeeListItem | null>(null);

  const columns: ColumnDef<FeeListItem>[] = [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => {
        const f = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {getInitials(`${f.student.firstName} ${f.student.lastName}`)}
            </div>
            <div>
              <p className="font-medium text-sm">
                {f.student.firstName} {f.student.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {f.student.admissionNumber}
                {f.student.class && ` · Class ${f.student.class.name}`}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "feeType",
      header: "Fee Type",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.feeType.name}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const f = row.original;
        const net = f.amount - f.discount + f.fine;
        return (
          <div>
            <p className="text-sm font-medium">{formatCurrency(net)}</p>
            {f.discount > 0 && (
              <p className="text-xs text-emerald-600">
                -{formatCurrency(f.discount)} disc.
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "paidAmount",
      header: "Paid",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatCurrency(row.original.paidAmount)}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <FeeStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const fee = row.original;
        const canCollect = ["UNPAID", "PARTIAL", "OVERDUE"].includes(fee.status);
        return canCollect ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCollectingFee(fee)}
            className="gap-1 text-xs"
          >
            <CreditCard className="h-3 w-3" />
            Collect
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {fee.receiptNumber ?? "—"}
          </span>
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

  function handleStatusFilter(status: string) {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ status: status || null, page: 1 })}`
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
      {collectingFee && (
        <CollectFeeForm
          fee={collectingFee}
          onClose={() => setCollectingFee(null)}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            defaultValue={searchParams.get("status") ?? ""}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="OVERDUE">Overdue</option>
            <option value="WAIVED">Waived</option>
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
                    <td
                      colSpan={columns.length}
                      className="px-4 py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">
                          No fee records found
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Assign fees to students to see them here
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