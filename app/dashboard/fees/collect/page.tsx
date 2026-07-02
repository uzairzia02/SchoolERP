import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFees } from "@/features/fees/actions/fee.actions";
import { FeeTable } from "@/features/fees/components/fee-table";
import type { FeeStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Collect Fees" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    classId?: string;
  }>;
}

export default async function CollectFeePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const feesData = await getFees({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    classId: params.classId,
    status: "UNPAID" as FeeStatus,
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/fees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <CreditCard className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Collect Fees</h1>
            <p className="text-sm text-muted-foreground">
              Collect pending fee payments from students
            </p>
          </div>
        </div>
      </div>

      <FeeTable initialData={feesData} />
    </div>
  );
}