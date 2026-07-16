import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingPaymentSubmissions } from "@/features/fees/actions/verify-payment.actions";
import { PaymentVerificationQueue } from "@/features/fees/components/payment-verification-queue";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Verify Payments" };

const ALLOWED_ROLES = ["ACCOUNTANT", "PRINCIPAL", "SUPER_ADMIN"];

export default async function VerifyPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/login");

  const submissions = await getPendingPaymentSubmissions();

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Verify Payments</h1>
          <p className="text-sm text-muted-foreground">
            Review and confirm fee payments submitted by parents
          </p>
        </div>
      </div>

      <PaymentVerificationQueue submissions={submissions ?? []} />
    </div>
  );
}