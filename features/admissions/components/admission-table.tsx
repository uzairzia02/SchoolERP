"use client";

import { useState, useTransition, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { AdmissionListItem } from "@/features/admissions/actions/admission.actions";
import { updateAdmissionStatusAction } from "@/features/admissions/actions/admission.actions";
import type { PaginatedResponse } from "@/types/globals.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, ChevronLeft, ChevronRight, Loader2,
  UserPlus, Eye, CheckCircle, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import type { AdmissionStatus } from "@prisma/client";

const STATUS_COLORS: Record<AdmissionStatus, string> = {
  APPLIED: "bg-blue-500/10 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-500/10 text-red-700 border-red-200",
  ENROLLED: "bg-violet-500/10 text-violet-700 border-violet-200",
  WITHDRAWN: "bg-gray-500/10 text-gray-700 border-gray-200",
};

interface AdmissionTableProps {
  initialData: PaginatedResponse<AdmissionListItem>;
}

export function AdmissionTable({ initialData }: AdmissionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  async function handleStatusUpdate(id: string, status: AdmissionStatus) {
    const result = await updateAdmissionStatusAction({ id, status });
    if (result.success) {
      toast.success(result.message ?? "Status updated.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<AdmissionListItem>[] = [
    {
      accessorKey: "name",
      header: "Applicant",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-600">
              {getInitials(`${a.firstName} ${a.lastName}`)}
            </div>
            <div>
              <p className="font-medium text-sm">
                {a.firstName} {a.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.phone ?? a.email ?? "—"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "applyingForClass",
      header: "Applying For",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.applyingForClass}</span>
      ),
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
      accessorKey: "appliedAt",
      header: "Applied",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.appliedAt)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.original.status]}`}
        >
          {row.original.status.replace("_", " ")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/dashboard/admissions/${a.id}`}>
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {a.status === "APPLIED" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-600 text-xs h-8"
                onClick={() => handleStatusUpdate(a.id, "UNDER_REVIEW")}
              >
                Review
              </Button>
            )}
            {(a.status === "APPLIED" || a.status === "UNDER_REVIEW") && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600"
                  onClick={() => handleStatusUpdate(a.id, "ACCEPTED")}
                  title="Accept"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleStatusUpdate(a.id, "REJECTED")}
                  title="Reject"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {a.status === "ACCEPTED" && (
              <Button
                asChild
                size="sm"
                className="text-xs h-8 gap-1"
              >
                <Link href={`/dashboard/admissions/${a.id}/enroll`}>
                  <UserPlus className="h-3 w-3" />
                  Enroll
                </Link>
              </Button>
            )}
          </div>
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
      router.push(`${pathname}?${createQueryString({ search: value || null, page: 1 })}`);
    });
  }

  function handleStatusFilter(status: string) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ status: status || null, page: 1 })}`);
    });
  }

  function handlePage(page: number) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ page })}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicant..."
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
          <option value="APPLIED">Applied</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <Button asChild size="sm">
          <Link href="/dashboard/admissions/new">
            <UserPlus className="h-4 w-4 mr-1" />
            New Application
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
                    <th key={header.id} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <UserPlus className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">No applications found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
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
            Showing {initialData.data.length} of {initialData.total} applications
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePage(initialData.page - 1)} disabled={!initialData.hasPrev || isPending}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {initialData.page} of {initialData.totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => handlePage(initialData.page + 1)} disabled={!initialData.hasNext || isPending}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}