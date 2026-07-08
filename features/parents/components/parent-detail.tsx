"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ParentDetail } from "@/features/parents/actions/parent.actions";
import {
  updateParentAction,
  resetParentPasswordAction,
} from "@/features/parents/actions/parent.actions";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, GraduationCap, CreditCard, ClipboardCheck,
  KeyRound, Save, Loader2, X, Phone, Mail,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PAID: "text-emerald-600",
  UNPAID: "text-yellow-600",
  PARTIAL: "text-blue-600",
  OVERDUE: "text-red-600",
};

interface ParentDetailProps {
  parent: ParentDetail;
}

export function ParentDetailView({ parent }: ParentDetailProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: parent.firstName,
    lastName: parent.lastName,
    phone: parent.phone,
    occupation: parent.occupation ?? "",
  });

  async function handleSave() {
    setIsSaving(true);
    const result = await updateParentAction({ id: parent.id, ...form });
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Parent updated.");
    setIsEditing(false);
    router.refresh();
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsResetting(true);
    const result = await resetParentPasswordAction(parent.id, newPassword);
    setIsResetting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Password reset.");
    setShowResetPassword(false);
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      {/* Reset Password Dialog */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold font-display">Reset Password</h3>
              <button onClick={() => setShowResetPassword(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>New Password (min 8 chars)</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowResetPassword(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleResetPassword} disabled={isResetting} className="gap-1">
                  {isResetting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-xl font-bold text-teal-600">
              {getInitials(`${parent.firstName} ${parent.lastName}`)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">
                {parent.firstName} {parent.lastName}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {parent.email}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {parent.phone}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={parent.isActive ? "default" : "secondary"}>
                  {parent.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {parent._count.students} child(ren) enrolled
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetPassword(true)}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Reset Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Edit Parent Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Occupation</Label>
              <Input
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                placeholder="Business, Job, etc."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Children */}
      <div className="space-y-4">
        {parent.students.map(({ student, relation }) => {
          const present = student.attendance.filter((a) => a.status === "PRESENT").length;
          const total = student.attendance.length;
          const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
          const pendingFees = student.fees.filter((f) => ["UNPAID", "OVERDUE", "PARTIAL"].includes(f.status));
          const totalPending = pendingFees.reduce((s, f) => s + (f.amount - f.paidAmount), 0);

          return (
            <div key={student.id} className="rounded-xl border bg-card overflow-hidden">
              {/* Child Header */}
              <div className="flex items-center justify-between p-5 border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(`${student.firstName} ${student.lastName}`)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold font-display">
                        {student.firstName} {student.lastName}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {relation}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {student.admissionNumber}
                      {student.class &&
                        ` · ${student.class.displayName}${student.section ? ` - ${student.section.name}` : ""}`}
                      {student.rollNumber && ` · Roll #${student.rollNumber}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={student.isActive ? "default" : "secondary"} className="text-[10px]">
                    {student.isActive ? "Enrolled" : "Inactive"}
                  </Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/students/${student.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                {/* Attendance This Month */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Attendance (This Month)</p>
                  </div>
                  {total === 0 ? (
                    <p className="text-xs text-muted-foreground">No attendance marked yet</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {present}/{total} days present
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            attendanceRate >= 75 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {attendanceRate}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            attendanceRate >= 75 ? "bg-emerald-500" : "bg-red-500"
                          }`}
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <div className="text-center">
                          <p className="text-xs font-bold text-emerald-600">{present}</p>
                          <p className="text-[10px] text-muted-foreground">Present</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-red-600">
                            {student.attendance.filter((a) => a.status === "ABSENT").length}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Absent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-yellow-600">
                            {student.attendance.filter((a) => a.status === "LATE").length}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Late</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Pending Fees */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Pending Fees</p>
                    </div>
                    {totalPending > 0 && (
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(totalPending)}
                      </span>
                    )}
                  </div>
                  {pendingFees.length === 0 ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <span className="text-xs font-medium">✓ All fees cleared</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingFees.slice(0, 3).map((fee) => (
                        <div
                          key={fee.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground">{fee.feeType.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${STATUS_COLORS[fee.status] ?? ""}`}>
                              {formatCurrency(fee.amount - fee.paidAmount)}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${STATUS_COLORS[fee.status] ?? ""}`}
                            >
                              {fee.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {pendingFees.length > 3 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{pendingFees.length - 3} more pending fees
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}