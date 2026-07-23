"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { applyLeaveAction } from "@/features/leaves/actions/leave.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LEAVE_TYPES = [
  { value: "CASUAL", label: "Casual" },
  { value: "SICK", label: "Sick" },
  { value: "ANNUAL", label: "Annual" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PATERNITY", label: "Paternity" },
  { value: "UNPAID", label: "Unpaid" },
];

export function ApplyLeaveForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  async function handleSubmit() {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      toast.error("Please fill all fields.");
      return;
    }

    setIsSubmitting(true);
    const result = await applyLeaveAction(form);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Leave application submitted.");
    setOpen(false);
    setForm({ type: "CASUAL", startDate: "", endDate: "", reason: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Apply for Leave
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card border shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold font-display">Apply for Leave</h3>
          <button onClick={() => setOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Leave Type *</Label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date *</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason *</Label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              placeholder="Briefly explain the reason for leave"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1">
            {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}