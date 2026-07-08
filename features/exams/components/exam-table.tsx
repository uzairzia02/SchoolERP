"use client";

import { useTransition, useCallback, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ExamListItem } from "@/features/exams/actions/exam.actions";
import {
  deleteExamAction,
  toggleExamPublishAction,
} from "@/features/exams/actions/exam.actions";
import type { PaginatedResponse } from "@/types/globals.types";
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
  Search, ChevronLeft, ChevronRight, Loader2,
  FileText, Plus, Eye, Pencil, Trash2,
  MoreHorizontal, Globe, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { ExamType } from "@prisma/client";

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MID_TERM: "Mid Term",
  FINAL: "Final",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  PRACTICAL: "Practical",
};

const EXAM_TYPE_COLORS: Record<ExamType, string> = {
  MID_TERM: "bg-blue-500/10 text-blue-700",
  FINAL: "bg-red-500/10 text-red-700",
  QUIZ: "bg-yellow-500/10 text-yellow-700",
  ASSIGNMENT: "bg-emerald-500/10 text-emerald-700",
  PRACTICAL: "bg-violet-500/10 text-violet-700",
};

interface ExamTableProps {
  initialData: PaginatedResponse<ExamListItem>;
}

export function ExamTable({ initialData }: ExamTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  async function handleDelete(exam: ExamListItem) {
    if (!confirm(`Delete "${exam.name}"?`)) return;
    const result = await deleteExamAction(exam.id);
    if (result.success) {
      toast.success("Exam deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleTogglePublish(exam: ExamListItem) {
    const result = await toggleExamPublishAction(exam.id, !exam.isPublished);
    if (result.success) {
      toast.success(result.message ?? "Updated.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns: ColumnDef<ExamListItem>[] = [
    {
      accessorKey: "name",
      header: "Exam",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div>
            <Link
              href={`/dashboard/exams/${e.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {e.name}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              {e.class.displayName}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EXAM_TYPE_COLORS[row.original.type]}`}
        >
          {EXAM_TYPE_LABELS[row.original.type]}
        </span>
      ),
    },
    {
      accessorKey: "dates",
      header: "Duration",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="text-sm">
            <p>{formatDate(e.startDate)}</p>
            <p className="text-xs text-muted-foreground">
              to {formatDate(e.endDate)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "marks",
      header: "Marks",
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium">{row.original.totalMarks}</p>
          <p className="text-xs text-muted-foreground">
            Pass: {row.original.passingMarks}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: ({ row }) => (
        <span className="text-sm">{row.original._count.subjects}</span>
      ),
    },
    {
      accessorKey: "grades",
      header: "Grades Entered",
      cell: ({ row }) => (
        <span className="text-sm">{row.original._count.grades}</span>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? "default" : "secondary"}>
          {row.original.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const exam = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/exams/${exam.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/exams/${exam.id}/grades`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Enter Grades
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTogglePublish(exam)}>
                {exam.isPublished ? (
                  <><EyeOff className="h-4 w-4 mr-2" />Unpublish</>
                ) : (
                  <><Globe className="h-4 w-4 mr-2" />Publish Results</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(exam)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          defaultValue={searchParams.get("type") ?? ""}
          onChange={(e) => {
            startTransition(() => {
              router.push(
                `${pathname}?${createQueryString({ type: e.target.value || null, page: 1 })}`
              );
            });
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Types</option>
          {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <Button asChild>
          <Link href="/dashboard/exams/new">
            <Plus className="h-4 w-4 mr-2" />
            New Exam
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
                    <th key={header.id} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
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
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">No exams found</p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href="/dashboard/exams/new">
                          <Plus className="h-4 w-4 mr-1" />
                          Create Exam
                        </Link>
                      </Button>
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
            {initialData.total} exam(s) total
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