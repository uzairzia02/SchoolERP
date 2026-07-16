"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentSubmission, rejectPaymentSubmission } from "@/features/fees/actions/verify-payment.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Clock, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Submission {
  id: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  feeType: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  submittedAt: Date;
}

export function PaymentVerificationQueue({ submissions }: { submissions: Submission[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approvePaymentSubmission(id);
      if (result.success) {
        toast.success(`Approved. Transaction #${result.data.transactionNumber}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to approve");
      }
    });
  }

  function handleReject() {
    if (!rejectingId) return;
    startTransition(async () => {
      const result = await rejectPaymentSubmission(rejectingId, rejectReason);
      if (result.success) {
        toast.success("Payment rejected");
        setRejectingId(null);
        setRejectReason("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reject");
      }
    });
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        No payments awaiting verification.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {submissions.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-medium">{s.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {s.className} • {s.admissionNumber}
                </p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-700 border-0 font-normal shrink-0">
                Pending
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-sm mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Fee Type</p>
                <p className="font-medium">{s.feeType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium">{formatCurrency(s.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="font-medium">{s.paymentMethod.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Landmark className="h-3 w-3" /> Reference No.
                </p>
                <p className="font-mono font-medium">{s.referenceNumber}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApprove(s.id)}
                disabled={isPending}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectingId(s.id)}
                disabled={isPending}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this payment?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Reference number doesn't match our bank records"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}