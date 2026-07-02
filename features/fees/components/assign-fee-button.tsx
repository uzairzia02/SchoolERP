"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignFeeForm } from "@/features/fees/components/assign-fee-form";

export function AssignFeeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <AssignFeeForm onClose={() => setOpen(false)} />}
      <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Assign Fee
      </Button>
    </>
  );
}