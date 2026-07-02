"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FeeTypeItem } from "@/features/fees/actions/fee.actions";
import { deleteFeeTypeAction } from "@/features/fees/actions/fee.actions";
import { FeeTypeForm } from "@/features/fees/components/fee-type-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, CreditCard } from "lucide-react";

interface FeeTypeTableProps {
  feeTypes: FeeTypeItem[];
}

export function FeeTypeTable({ feeTypes }: FeeTypeTableProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<FeeTypeItem | null>(null);

  async function handleDelete(feeType: FeeTypeItem) {
    if (!confirm(`Delete "${feeType.name}"?`)) return;
    const result = await deleteFeeTypeAction(feeType.id);
    if (result.success) {
      toast.success("Fee type deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {feeTypes.length} fee type(s)
        </p>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingType(null); }}>
          <Plus className="h-4 w-4 mr-1" />
          Add Fee Type
        </Button>
      </div>

      {/* Inline form */}
      {(showForm || editingType) && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display text-sm">
              {editingType ? "Edit Fee Type" : "New Fee Type"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingType(null); }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <FeeTypeForm
            feeType={editingType ?? undefined}
            onSuccess={() => { setShowForm(false); setEditingType(null); }}
          />
        </div>
      )}

      {feeTypes.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No fee types yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add fee types to start assigning fees to students
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Fee Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Records
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {feeTypes.map((ft) => (
                <tr key={ft.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ft.name}</p>
                    {ft.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ft.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(ft.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ft.isRecurring ? "default" : "secondary"}>
                      {ft.isRecurring ? "Recurring" : "One-time"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ft._count.fees}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingType(ft); setShowForm(false); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ft)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}