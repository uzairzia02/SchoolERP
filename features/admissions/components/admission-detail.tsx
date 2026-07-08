import type { AdmissionDetail } from "@/features/admissions/actions/admission.actions";
import { formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, School, MapPin, UserPlus } from "lucide-react";
import Link from "next/link";
import type { AdmissionStatus } from "@prisma/client";

const STATUS_COLORS: Record<AdmissionStatus, string> = {
  APPLIED: "bg-blue-500/10 text-blue-700",
  UNDER_REVIEW: "bg-yellow-500/10 text-yellow-700",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-red-500/10 text-red-700",
  ENROLLED: "bg-violet-500/10 text-violet-700",
  WITHDRAWN: "bg-gray-500/10 text-gray-700",
};

interface AdmissionDetailProps {
  admission: AdmissionDetail;
}

export function AdmissionDetailView({ admission }: AdmissionDetailProps) {
  // Parse parent info
  let parentInfo: Record<string, string> | null = null;
  let previousSchool: Record<string, string> | null = null;

  for (const doc of admission.documents) {
    try {
      const parsed = JSON.parse(doc);
      if (parsed.type === "parent_info") parentInfo = parsed;
      if (parsed.type === "previous_school") previousSchool = parsed;
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-xl font-bold text-violet-600">
              {getInitials(`${admission.firstName} ${admission.lastName}`)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">
                {admission.firstName} {admission.lastName}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Applying for: {admission.applyingForClass}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[admission.status]}`}>
                  {admission.status.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  Applied {formatDate(admission.appliedAt)}
                </span>
              </div>
            </div>
          </div>
          {admission.status === "ACCEPTED" && (
            <Button asChild size="sm" className="gap-2">
              <Link href={`/dashboard/admissions/${admission.id}/enroll`}>
                <UserPlus className="h-4 w-4" />
                Enroll Now
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Info */}
        <InfoCard title="Student Information" icon={User}>
          <InfoGrid>
            <InfoItem label="First Name" value={admission.firstName} />
            <InfoItem label="Last Name" value={admission.lastName} />
            <InfoItem label="Date of Birth" value={formatDate(admission.dateOfBirth)} />
            <InfoItem label="Gender" value={admission.gender} />
            <InfoItem label="Religion" value={admission.religion} />
            <InfoItem label="Nationality" value={admission.nationality} />
            <InfoItem label="Phone" value={admission.phone} />
            <InfoItem label="Email" value={admission.email} />
          </InfoGrid>
        </InfoCard>

        {/* Parent Info */}
        {parentInfo && (
          <InfoCard title="Parent / Guardian" icon={User}>
            <InfoGrid>
              <InfoItem label="Name" value={`${parentInfo.parentFirstName} ${parentInfo.parentLastName}`} />
              <InfoItem label="Relation" value={parentInfo.parentRelation} />
              <InfoItem label="Email" value={parentInfo.parentEmail} />
              <InfoItem label="Phone" value={parentInfo.parentPhone} />
              <InfoItem label="Occupation" value={parentInfo.parentOccupation} />
            </InfoGrid>
          </InfoCard>
        )}

        {/* Address */}
        <InfoCard title="Address" icon={MapPin}>
          <InfoGrid>
            <InfoItem label="Address" value={admission.address} className="col-span-2" />
            <InfoItem label="City" value={admission.city} />
            <InfoItem label="Country" value={admission.country} />
          </InfoGrid>
        </InfoCard>

        {/* Previous School */}
        {previousSchool && (previousSchool.previousSchool || previousSchool.previousClass) && (
          <InfoCard title="Previous School" icon={School}>
            <InfoGrid>
              <InfoItem label="School Name" value={previousSchool.previousSchool} className="col-span-2" />
              <InfoItem label="Last Class" value={previousSchool.previousClass} />
              <InfoItem label="Grade / Result" value={previousSchool.previousGrade} />
            </InfoGrid>
          </InfoCard>
        )}
      </div>

      {admission.remarks && (
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Remarks</p>
          <p className="text-sm">{admission.remarks}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold font-display text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function InfoItem({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}