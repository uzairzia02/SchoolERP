"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import type { ProfileData } from "@/features/profile/actions/profile.actions";
import {
  changePasswordAction,
  updateProfileAction,
} from "@/features/profile/actions/profile.actions";
import { useRouter } from "next/navigation";
import { formatDate, formatRelative, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Shield, Building2, GraduationCap, Briefcase,
  KeyRound, Save, Loader2, Phone, Mail, Calendar,
  MapPin, Clock,
} from "lucide-react";
import { USER_ROLE_LABELS } from "@/constants/enums";
import type { UserRole } from "@prisma/client";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

interface ProfileViewProps {
  profile: ProfileData;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [phone, setPhone] = useState(profile.profile?.phone ?? "");
  const [address, setAddress] = useState((profile.profile as any)?.address ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const p = profile.profile;
  const displayName = p
    ? `${p.firstName} ${p.lastName}`
    : profile.email;

  async function handleSaveProfile() {
    setIsSaving(true);
    const result = await updateProfileAction({ phone, address });
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated.");
    setIsEditing(false);
    router.refresh();
  }

  async function onPasswordSubmit(values: PasswordForm) {
    const result = await changePasswordAction(values);
    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof PasswordForm, { message: messages[0] });
        });
      }
      toast.error(result.error);
      return;
    }
    toast.success("Password changed successfully.");
    setShowPasswordForm(false);
    reset();
  }

  const roleColor: Record<UserRole, string> = {
    SUPER_ADMIN: "bg-red-500/10 text-red-700",
    PRINCIPAL: "bg-blue-500/10 text-blue-700",
    HR: "bg-violet-500/10 text-violet-700",
    ACCOUNTANT: "bg-teal-500/10 text-teal-700",
    TEACHER: "bg-emerald-500/10 text-emerald-700",
    FACULTY: "bg-emerald-500/10 text-emerald-700",
    STUDENT: "bg-orange-500/10 text-orange-700",
    PARENT: "bg-yellow-500/10 text-yellow-700",
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary shrink-0">
              {getInitials(displayName)}
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor[profile.role as UserRole]}`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {USER_ROLE_LABELS[profile.role as UserRole]}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {profile.schoolName}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {profile.email}
              </div>
              {profile.lastLoginAt && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last login: {formatRelative(profile.lastLoginAt)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="gap-1.5"
            >
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Password Form */}
      {showPasswordForm && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Change Password</h3>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label>Current Password *</Label>
              <Input
                type="password"
                {...register("currentPassword")}
                className={errors.currentPassword ? "border-destructive" : ""}
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>New Password * (min 8, uppercase, number)</Label>
              <Input
                type="password"
                {...register("newPassword")}
                className={errors.newPassword ? "border-destructive" : ""}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password *</Label>
              <Input
                type="password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1">
                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Change Password
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowPasswordForm(false); reset(); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Profile */}
      {isEditing && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Edit Contact Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92-300-1234567"
              />
            </div>
            {profile.role !== "PARENT" && (
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, Karachi"
                />
              </div>
            )}
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving} size="sm" className="gap-1">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>
      )}

      {/* Profile Details */}
      {p && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">Personal Information</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Full Name" value={`${p.firstName} ${p.lastName}`} />
              <InfoRow label="Email" value={profile.email} icon={<Mail className="h-3.5 w-3.5" />} />
              <InfoRow label="Phone" value={p.phone} icon={<Phone className="h-3.5 w-3.5" />} />
              {(p as any).gender && (
                <InfoRow label="Gender" value={(p as any).gender} />
              )}
              {(p as any).dateOfBirth && (
                <InfoRow
                  label="Date of Birth"
                  value={formatDate((p as any).dateOfBirth)}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              )}
              {(p as any).address && (
                <InfoRow
                  label="Address"
                  value={(p as any).address}
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />
              )}
            </div>
          </div>

          {/* Role-specific Info */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              {profile.role === "STUDENT" ? (
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              )}
              <h3 className="font-semibold font-display text-sm">
                {profile.role === "STUDENT"
                  ? "Academic Information"
                  : profile.role === "PARENT"
                  ? "Account Information"
                  : "Employment Information"}
              </h3>
            </div>
            <div className="space-y-3">
              {(p as any).employeeId && (
                <InfoRow label="Employee ID" value={(p as any).employeeId} />
              )}
              {(p as any).admissionNumber && (
                <InfoRow label="Admission Number" value={(p as any).admissionNumber} />
              )}
              {(p as any).rollNumber && (
                <InfoRow label="Roll Number" value={(p as any).rollNumber} />
              )}
              {(p as any).class && (
                <InfoRow
                  label="Class"
                  value={`${(p as any).class.displayName}${(p as any).section ? ` - Section ${(p as any).section.name}` : ""}`}
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                />
              )}
              {(p as any).department && (
                <InfoRow
                  label="Department"
                  value={(p as any).department.name}
                  icon={<Building2 className="h-3.5 w-3.5" />}
                />
              )}
              {(p as any).designation && (
                <InfoRow label="Designation" value={(p as any).designation.name} />
              )}
              {(p as any).qualification && (
                <InfoRow label="Qualification" value={(p as any).qualification} />
              )}
              {(p as any).experience !== undefined && (p as any).experience !== null && (
                <InfoRow label="Experience" value={`${(p as any).experience} years`} />
              )}
              {(p as any).joiningDate && (
                <InfoRow
                  label="Joining Date"
                  value={formatDate((p as any).joiningDate)}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              )}
              {(p as any).admissionDate && (
                <InfoRow
                  label="Admission Date"
                  value={formatDate((p as any).admissionDate)}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              )}
              <InfoRow
                label="Status"
                value={
                  <Badge variant={p.isActive ? "default" : "secondary"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mt-0.5">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-right">{value}</div>
    </div>
  );
}