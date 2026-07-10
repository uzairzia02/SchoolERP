"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateMonthlyRecurringFees } from "@/features/fees/actions/generate-monthly-fees.actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";

export function GenerateMonthlyFeesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateMonthlyRecurringFees();

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="h-4 w-4 mr-2" />
          Generate This Month&apos;s Fees
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate monthly recurring fees?</AlertDialogTitle>
          <AlertDialogDescription>
            This will create fee records for all active students for every recurring fee type
            (e.g. Monthly Tuition), due on the 10th of this month. Students who already have a
            fee record for this month will be skipped automatically — safe to run multiple times.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleGenerate} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
