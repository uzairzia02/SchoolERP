import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CreditCard, Settings, UserPlus } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFees, getFeeSummary } from "@/features/fees/actions/fee.actions";
import { FeeTable } from "@/features/fees/components/fee-table";
import { FeeSummaryCards } from "@/features/fees/components/fee-summary-cards";
import { AssignFeeButton } from "@/features/fees/components/assign-fee-button";
import { Button } from "@/components/ui/button";
import type { FeeStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Fee Management" };

const ALLOWED_ROLES = ["ACCOUNTANT", "PRINCIPAL", "SUPER_ADMIN"];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    classId?: string;
    feeTypeId?: string;
  }>;
}

export default async function FeesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/login");

  const params = await searchParams;

  const [feesData, summary] = await Promise.all([
    getFees({
      page: params.page ? parseInt(params.page) : 1,
      search: params.search,
      status: params.status as FeeStatus | undefined,
      classId: params.classId,
      feeTypeId: params.feeTypeId,
    }),
    getFeeSummary(),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <CreditCard className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Fee Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage student fees and collections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AssignFeeButton />
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/fees/types">
              <Settings className="h-4 w-4 mr-2" />
              Fee Types
            </Link>
          </Button>
        </div>
      </div>

      <FeeSummaryCards summary={summary} />

      <Suspense fallback={<div>Loading...</div>}>
        <FeeTable initialData={feesData} />
      </Suspense>
    </div>
  );
}
