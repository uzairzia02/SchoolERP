import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFeeTypes } from "@/features/fees/actions/fee.actions";
import { FeeTypeTable } from "@/features/fees/components/fee-type-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Fee Types" };

const ALLOWED_ROLES = ["ACCOUNTANT", "PRINCIPAL", "SUPER_ADMIN"];

export default async function FeeTypesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/login");

  const feeTypes = await getFeeTypes();

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
            <h1 className="text-2xl font-bold font-display">Fee Types</h1>
            <p className="text-sm text-muted-foreground">
              Configure fee categories and default amounts
            </p>
          </div>
        </div>
      </div>

      <FeeTypeTable feeTypes={feeTypes} />
    </div>
  );
}
