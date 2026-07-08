"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, Trash2, Calendar, Home } from "lucide-react";
import { z } from "zod";
import {
  updateAcademicSettingsAction,
  createTermAction,
  deleteTermAction,
  createHouseAction,
  deleteHouseAction,
} from "@/features/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";

const academicSchema = z.object({
  currentSession: z.string().min(1),
  sessionStartDate: z.string().min(1),
  sessionEndDate: z.string().min(1),
  termsCount: z.coerce.number().int().min(1).max(4),
  timezone: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
});

type AcademicFormData = z.infer<typeof academicSchema>;

interface AcademicSettingsProps {
  settings: {
    currentSession: string;
    sessionStartDate: Date | null;
    sessionEndDate: Date | null;
    termsCount: number;
    timezone: string;
    currency: string;
    dateFormat: string;
  };
  terms: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    session: string;
    weightage: number;
    isActive: boolean;
  }[];
  houses: {
    id: string;
    name: string;
    color: string | null;
  }[];
}

export function AcademicSettings({ settings, terms, houses }: AcademicSettingsProps) {
  const router = useRouter();
  const [showTermForm, setShowTermForm] = useState(false);
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [termName, setTermName] = useState("");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [termWeightage, setTermWeightage] = useState("33");
  const [houseName, setHouseName] = useState("");
  const [houseColor, setHouseColor] = useState("#3b82f6");
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [isAddingHouse, setIsAddingHouse] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AcademicFormData>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      currentSession: settings.currentSession,
      sessionStartDate: settings.sessionStartDate
        ? new Date(settings.sessionStartDate).toISOString().split("T")[0]
        : "",
      sessionEndDate: settings.sessionEndDate
        ? new Date(settings.sessionEndDate).toISOString().split("T")[0]
        : "",
      termsCount: settings.termsCount,
      timezone: settings.timezone,
      currency: settings.currency,
      dateFormat: settings.dateFormat,
    },
  });

  async function onSubmit(values: AcademicFormData) {
    const result = await updateAcademicSettingsAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved.");
  }

  async function handleAddTerm() {
    if (!termName || !termStart || !termEnd) {
      toast.error("Fill all term fields.");
      return;
    }
    setIsAddingTerm(true);
    const result = await createTermAction({
      name: termName,
      startDate: termStart,
      endDate: termEnd,
      session: settings.currentSession,
      weightage: parseInt(termWeightage),
    });
    setIsAddingTerm(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Term added.");
    setTermName("");
    setTermStart("");
    setTermEnd("");
    setShowTermForm(false);
    router.refresh();
  }

  async function handleDeleteTerm(id: string) {
    if (!confirm("Delete this term?")) return;
    const result = await deleteTermAction(id);
    if (result.success) {
      toast.success("Term deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleAddHouse() {
    if (!houseName) {
      toast.error("House name required.");
      return;
    }
    setIsAddingHouse(true);
    const result = await createHouseAction({ name: houseName, color: houseColor });
    setIsAddingHouse(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("House created.");
    setHouseName("");
    setShowHouseForm(false);
    router.refresh();
  }

  async function handleDeleteHouse(id: string) {
    if (!confirm("Delete this house?")) return;
    const result = await deleteHouseAction(id);
    if (result.success) {
      toast.success("House deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Settings */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Academic Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current Session *</Label>
              <Input
                {...register("currentSession")}
                placeholder="2025-2026"
                className={cn(errors.currentSession && "border-destructive")}
              />
              {errors.currentSession && (
                <p className="text-xs text-destructive">{errors.currentSession.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Terms Per Year *</Label>
              <select
                {...register("termsCount")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={1}>1 Term (Annual)</option>
                <option value={2}>2 Terms (Semester)</option>
                <option value={3}>3 Terms (Trimester)</option>
                <option value={4}>4 Terms (Quarterly)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Session Start Date *</Label>
              <Input type="date" {...register("sessionStartDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Session End Date *</Label>
              <Input type="date" {...register("sessionEndDate")} />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">System Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <select
                {...register("timezone")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <select
                {...register("currency")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Date Format</Label>
              <select
                {...register("dateFormat")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD MMM YYYY">DD MMM YYYY</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Session Settings
          </Button>
        </div>
      </form>

      {/* Terms */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold font-display">Terms / Semesters</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowTermForm(!showTermForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Term
          </Button>
        </div>

        {showTermForm && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Term Name</Label>
                <Input
                  placeholder="First Term / Mid Term / Final"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Weightage (%)</Label>
                <Input
                  type="number"
                  value={termWeightage}
                  onChange={(e) => setTermWeightage(e.target.value)}
                  className="h-9"
                  min={1}
                  max={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowTermForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddTerm} disabled={isAddingTerm} className="gap-1">
                {isAddingTerm && <Loader2 className="h-3 w-3 animate-spin" />}
                Add Term
              </Button>
            </div>
          </div>
        )}

        {terms.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No terms defined yet
          </p>
        ) : (
          <div className="space-y-2">
            {terms.map((term) => (
              <div key={term.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {term.weightage}%
                  </div>
                  <div>
                    <p className="text-sm font-medium">{term.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(term.startDate)} — {formatDate(term.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{term.session}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteTerm(term.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Houses */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold font-display">Houses / Groups</h3>
            <span className="text-xs text-muted-foreground">(e.g. Red House, Blue House, Science Group)</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowHouseForm(!showHouseForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Add House
          </Button>
        </div>

        {showHouseForm && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">House Name</Label>
                <Input
                  placeholder="Red House / Science"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={houseColor}
                    onChange={(e) => setHouseColor(e.target.value)}
                    className="h-9 w-16 rounded-md border cursor-pointer"
                  />
                  <span className="text-sm font-mono text-muted-foreground">{houseColor}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowHouseForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddHouse} disabled={isAddingHouse} className="gap-1">
                {isAddingHouse && <Loader2 className="h-3 w-3 animate-spin" />}
                Add House
              </Button>
            </div>
          </div>
        )}

        {houses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No houses defined</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {houses.map((house) => (
              <div
                key={house.id}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5"
              >
                {house.color && (
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: house.color }}
                  />
                )}
                <span className="text-sm font-medium">{house.name}</span>
                <button
                  onClick={() => handleDeleteHouse(house.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}