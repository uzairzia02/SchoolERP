import type { Metadata } from "next";
import { getAuditLogs } from "@/features/settings/actions/settings.actions";
import { AuditLogs } from "@/features/settings/components/audit-logs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Audit Logs" };

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { logs, total, page, totalPages } = await getAuditLogs({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Complete trail of all system activity
          </p>
        </div>
      </div>
      <AuditLogs
        logs={logs as any}
        total={total}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}