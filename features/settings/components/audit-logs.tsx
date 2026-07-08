"use client";

import { useTransition, useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Shield, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { USER_ROLE_LABELS } from "@/constants/enums";
import type { UserRole } from "@prisma/client";

type AuditLogItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    email: string;
    role: UserRole;
    teacher: { firstName: string; lastName: string } | null;
    employee: { firstName: string; lastName: string } | null;
  } | null;
};

interface AuditLogsProps {
  logs: AuditLogItem[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-700",
  UPDATE: "bg-blue-500/10 text-blue-700",
  DELETE: "bg-red-500/10 text-red-700",
  LOGIN: "bg-violet-500/10 text-violet-700",
  LOGOUT: "bg-gray-500/10 text-gray-700",
};

export function AuditLogs({ logs, total, page, totalPages }: AuditLogsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

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

  function handlePage(p: number) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ page: p })}`);
    });
  }

  function getUserName(user: AuditLogItem["user"]): string {
    if (!user) return "System";
    const profile = user.teacher ?? user.employee;
    return profile ? `${profile.firstName} ${profile.lastName}` : user.email;
  }

  function getActionColor(action: string): string {
    const key = Object.keys(ACTION_COLORS).find((k) =>
      action.toUpperCase().includes(k)
    );
    return key ? ACTION_COLORS[key] : "bg-gray-500/10 text-gray-700";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search action or entity..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">{total} total logs</p>
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
              <tr className="border-b bg-muted/30">
                {["Time", "User", "Role", "Action", "Entity", "IP Address"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Shield className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {getInitials(getUserName(log.user))}
                        </div>
                        <span className="text-xs font-medium">{getUserName(log.user)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {log.user && (
                        <Badge variant="outline" className="text-[10px]">
                          {USER_ROLE_LABELS[log.user.role]}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs">
                        {log.entity}
                        {log.entityId && (
                          <span className="text-muted-foreground font-mono ml-1">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {log.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}