"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitFeePayment } from "@/features/parents/actions/pay-fee.actions";
import { getSchoolBankDetails } from "@/features/parents/actions/school-bank.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Wallet, CheckCircle2, Printer, Landmark, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PayFeeDialogProps {
  feeId: string;
  studentId: string;
  feeTypeName: string;
  amountDue: number;
}

type Receipt = {
  transactionNumber: string;
  studentName: string;
  className: string;
  sectionName: string;
  schoolName: string;
  feeType: string;
  amount: number;
  paidAt: Date;
  paymentMethod: string;
};

type BankDetails = {
  schoolName: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
};

export function PayFeeDialog({ feeId, studentId, feeTypeName, amountDue }: PayFeeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState<"BANK_TRANSFER" | "ONLINE">("BANK_TRANSFER");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  useEffect(() => {
    if (open && !receipt) {
      getSchoolBankDetails().then(setBankDetails);
    }
  }, [open, receipt]);

  function handleConfirm() {
    startTransition(async () => {
      const result = await submitFeePayment({ feeId, studentId, paymentMethod: method });

      if (result.success) {
        setReceipt(result.data);
        router.refresh();
      } else {
        toast.error(result.error ?? "Payment failed");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setReceipt(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Wallet className="h-3.5 w-3.5 mr-1.5" />
          Pay Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!receipt ? (
          <>
            <DialogHeader>
              <DialogTitle>Pay {feeTypeName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Due</span>
                <span className="text-lg font-semibold">{formatCurrency(amountDue)}</span>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="ONLINE">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* School bank details */}
              {bankDetails?.bankAccountNumber ? (
                <div className="rounded-lg border border-dashed p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5" />
                    School Bank Account
                  </p>
                  <div className="text-sm space-y-1">
                    {bankDetails.bankName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank</span>
                        <span className="font-medium">{bankDetails.bankName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account No.</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-medium">{bankDetails.bankAccountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankDetails.bankAccountNumber!)}
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    {bankDetails.bankBranch && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Branch</span>
                        <span className="font-medium">{bankDetails.bankBranch}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
                  Bank account details haven&apos;t been configured by the school yet.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <PaymentSlip receipt={receipt} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentSlip({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const paidAtStr = new Date(receipt.paidAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Payment Recorded
        </DialogTitle>
      </DialogHeader>

      <div id="payment-slip" className="space-y-3 py-2">
        <div className="rounded-lg border-2 border-dashed p-4 space-y-2">
          <div className="text-center pb-2 border-b">
            <p className="text-xs text-muted-foreground">{receipt.schoolName}</p>
            <p className="text-xs text-muted-foreground">Transaction Number</p>
            <p className="font-mono font-semibold text-sm">{receipt.transactionNumber}</p>
          </div>

          <Row label="Student" value={receipt.studentName} />
          <Row label="Class" value={`${receipt.className} - ${receipt.sectionName}`} />
          <Row label="Fee Type" value={receipt.feeType} />
          <Row label="Amount Paid" value={formatCurrency(receipt.amount)} bold />
          <Row label="Payment Method" value={receipt.paymentMethod.replace("_", " ")} />
          <Row label="Date & Time" value={paidAtStr} />
        </div>

        <p className="text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
          Keep this transaction number (<span className="font-mono font-medium">{receipt.transactionNumber}</span>).
          The accounts office and school administration have been notified with the same number.
        </p>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
