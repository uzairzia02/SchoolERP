"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import type { AnnouncementListItem } from "@/features/announcements/actions/announcement.actions";
import {
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from "@/features/announcements/actions/announcement.actions";
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
  Megaphone, Plus, MoreHorizontal, Pencil,
  Trash2, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/constants/enums";
import type { UserRole } from "@prisma/client";

interface AnnouncementListProps {
  initialData: PaginatedResponse<AnnouncementListItem>;
  canManage: boolean;
}

export function AnnouncementList({ initialData, canManage }: AnnouncementListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const result = await deleteAnnouncementAction(id);
    if (result.success) {
      toast.success("Announcement deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const result = await toggleAnnouncementAction(id, !isActive);
    if (result.success) {
      toast.success(isActive ? "Announcement hidden." : "Announcement published.");
      router.refresh();
    }
  }

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

  function handlePage(page: number) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ page })}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Published/Hidden filter — managers only. Non-managers should never
            see hidden announcements, so this control (and the underlying
            query) is restricted to canManage. */}
        {canManage && (
          <select
            defaultValue={searchParams.get("isActive") ?? ""}
            onChange={(e) => {
              startTransition(() => {
                router.push(`${pathname}?${createQueryString({ isActive: e.target.value || null, page: 1 })}`);
              });
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All</option>
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
        )}

        {canManage && (
          <Button asChild>
            <Link href="/dashboard/announcements/new">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Link>
          </Button>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </div>
      )}

      {initialData.data.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No announcements yet</p>
          {canManage && (
            <Button asChild size="sm" className="mt-4">
              <Link href="/dashboard/announcements/new">
                <Plus className="h-4 w-4 mr-1" />
                Create First Announcement
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.data.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-xl border bg-card p-5 transition-all ${
                !announcement.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {canManage && (
                      <Badge
                        variant={announcement.isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {announcement.isActive ? "Published" : "Hidden"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(announcement.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-semibold font-display text-base mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {announcement.targetRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {USER_ROLE_LABELS[role as UserRole]}
                      </span>
                    ))}
                  </div>
                </div>

                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggle(announcement.id, announcement.isActive)
                        }
                      >
                        {announcement.isActive ? (
                          <><EyeOff className="h-4 w-4 mr-2" />Hide</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" />Publish</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleDelete(announcement.id, announcement.title)
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {initialData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {initialData.total} announcement(s)
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
              {initialData.page} / {initialData.totalPages}
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
      )}
    </div>
  );
}
