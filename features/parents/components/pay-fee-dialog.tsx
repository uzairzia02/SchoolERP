"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitPaymentForVerification } from "@/features/parents/actions/submit-payment.actions";
import { getSchoolBankDetails } from "@/features/parents/actions/school-bank.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Wallet, Clock, Landmark, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PayFeeDialogProps {
  feeId: string;
  studentId: string;
  feeTypeName: string;
  amountDue: number;
}

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
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  useEffect(() => {
    if (open && !submitted) {
      getSchoolBankDetails().then(setBankDetails);
    }
  }, [open, submitted]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      toast.error("Please enter your bank transaction/reference number.");
      return;
    }

    startTransition(async () => {
      const result = await submitPaymentForVerification({
        feeId,
        studentId,
        referenceNumber,
        paymentMethod: method,
      });

      if (result.success) {
        setSubmitted(true);
        router.refresh();
      } else {
        toast.error(result.error ?? "Submission failed");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setSubmitted(false);
    setReferenceNumber("");
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
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Pay {feeTypeName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Due</span>
                <span className="text-lg font-semibold">{formatCurrency(amountDue)}</span>
              </div>

              {bankDetails?.bankAccountNumber ? (
                <div className="rounded-lg border border-dashed p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5" />
                    Transfer to this account
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
                        <button type="button" onClick={() => copyToClipboard(bankDetails.bankAccountNumber!)}>
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
                  Bank account details haven&apos;t been configured yet. Contact the accounts office.
                </p>
              )}

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

              <div className="space-y-2">
                <Label htmlFor="ref">Your Bank Transaction / Reference Number</Label>
                <Input
                  id="ref"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TXN123456789"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  After transferring, enter your bank&apos;s transaction number here. The accounts
                  office will verify it before marking this fee as paid.
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Verification
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Submitted — Awaiting Verification
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Your payment details have been sent to the accounts office. Once verified, this
                fee will be marked as paid and you&apos;ll receive a notification with your
                transaction number.
              </p>
              <p className="text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
                This may take some time depending on the school&apos;s verification process.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
