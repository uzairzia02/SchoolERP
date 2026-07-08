"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Plus, Shield, UserX, UserCheck,
  KeyRound, X,
} from "lucide-react";
import {
  createUserAction,
  toggleUserStatusAction,
  resetUserPasswordAction,
} from "@/features/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatRelative, getInitials } from "@/lib/utils";
import { USER_ROLE_LABELS } from "@/constants/enums";
import type { UserRole } from "@prisma/client";

type UserItem = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  student: { firstName: string; lastName: string } | null;
  teacher: { firstName: string; lastName: string } | null;
  employee: { firstName: string; lastName: string } | null;
  parent: { firstName: string; lastName: string } | null;
};

interface UserManagementProps {
  users: UserItem[];
  currentUserId: string;
}

export function UserManagement({ users, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "TEACHER" as UserRole,
  });

  function getDisplayName(user: UserItem): string {
    const profile = user.student ?? user.teacher ?? user.employee ?? user.parent;
    return profile ? `${profile.firstName} ${profile.lastName}` : user.email;
  }

  async function handleCreate() {
    if (!form.email || !form.password) {
      toast.error("Fill all fields.");
      return;
    }
    setIsCreating(true);
    const result = await createUserAction(form);
    setIsCreating(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User created.");
    setForm({ email: "", password: "", role: "TEACHER" });
    setShowForm(false);
    router.refresh();
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    const result = await toggleUserStatusAction(id, !currentStatus);
    if (result.success) {
      toast.success(result.message ?? "Updated.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleResetPassword() {
    if (!resetUserId || !newPassword) {
      toast.error("Enter new password.");
      return;
    }
    setIsResetting(true);
    const result = await resetUserPasswordAction(resetUserId, newPassword);
    setIsResetting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Password reset.");
    setResetUserId(null);
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      {/* Reset Password Dialog */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold font-display">Reset Password</h3>
              <button onClick={() => setResetUserId(null)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setResetUserId(null)}>
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

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display">User Accounts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage system user accounts and access
            </p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </div>

        {showForm && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  placeholder="user@school.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password *</Label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role *</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={isCreating} className="gap-1">
                {isCreating && <Loader2 className="h-3 w-3 animate-spin" />}
                Create User
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["User", "Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(getDisplayName(user))}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{USER_ROLE_LABELS[user.role]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "default" : "secondary"} className="text-[10px]">
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    {user.id !== currentUserId && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? (
                            <UserX className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Reset Password"
                          onClick={() => { setResetUserId(user.id); setNewPassword(""); }}
                        >
                          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}