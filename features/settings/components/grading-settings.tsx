"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import {
  createGradeScaleAction,
  deleteGradeScaleAction,
  seedDefaultGradeScales,
} from "@/features/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradingSettingsProps {
  gradeScales: {
    id: string;
    grade: string;
    minMarks: number;
    maxMarks: number;
    gpa: number;
    remarks: string | null;
  }[];
}

export function GradingSettings({ gradeScales }: GradingSettingsProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    grade: "",
    minMarks: "",
    maxMarks: "",
    gpa: "",
    remarks: "",
  });

  async function handleSeed() {
    setIsSeeding(true);
    const result = await seedDefaultGradeScales();
    setIsSeeding(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Default grade scales loaded.");
    router.refresh();
  }

  async function handleAdd() {
    if (!form.grade || !form.minMarks || !form.maxMarks || !form.gpa) {
      toast.error("Fill all required fields.");
      return;
    }
    setIsAdding(true);
    const result = await createGradeScaleAction({
      grade: form.grade,
      minMarks: parseInt(form.minMarks),
      maxMarks: parseInt(form.maxMarks),
      gpa: parseFloat(form.gpa),
      remarks: form.remarks || undefined,
    });
    setIsAdding(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Grade scale added.");
    setForm({ grade: "", minMarks: "", maxMarks: "", gpa: "", remarks: "" });
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this grade scale?")) return;
    const result = await deleteGradeScaleAction(id);
    if (result.success) {
      toast.success("Deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display">Grading Scale</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define how marks translate to grades and GPA
            </p>
          </div>
          <div className="flex items-center gap-2">
            {gradeScales.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeed}
                disabled={isSeeding}
                className="gap-1"
              >
                {isSeeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Load Defaults
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Grade
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Grade *</Label>
                <Input
                  placeholder="A+"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Min Marks *</Label>
                <Input
                  type="number"
                  placeholder="90"
                  value={form.minMarks}
                  onChange={(e) => setForm({ ...form, minMarks: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Marks *</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.maxMarks}
                  onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GPA *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="4.0"
                  value={form.gpa}
                  onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Remarks</Label>
                <Input
                  placeholder="Outstanding"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAdd} disabled={isAdding} className="gap-1">
                {isAdding && <Loader2 className="h-3 w-3 animate-spin" />}
                Add
              </Button>
            </div>
          </div>
        )}

        {gradeScales.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No grade scales defined</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Load Defaults" for Pakistani grading system (A+ to F)
            </p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Grade", "Min Marks", "Max Marks", "GPA", "Remarks", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gradeScales.map((scale) => (
                  <tr key={scale.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-primary">{scale.grade}</span>
                    </td>
                    <td className="px-4 py-2.5">{scale.minMarks}%</td>
                    <td className="px-4 py-2.5">{scale.maxMarks}%</td>
                    <td className="px-4 py-2.5">{scale.gpa.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{scale.remarks ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(scale.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}