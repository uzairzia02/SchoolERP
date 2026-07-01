import type { StudentDetail } from "@/features/students/actions/student.actions";
import { formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User, GraduationCap, MapPin, Phone, Mail,
  Calendar, Pencil, Users2,
} from "lucide-react";
import Link from "next/link";
import { GENDER_LABELS } from "@/constants/enums";
import type { Gender } from "@prisma/client";

interface StudentDetailProps {
  student: StudentDetail;
}

export function StudentDetailView({ student }: StudentDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {getInitials(`${student.firstName} ${student.lastName}`)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {student.admissionNumber}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={student.isActive ? "default" : "secondary"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
                {student.class && (
                  <Badge variant="outline">
                    Class {student.class.name}
                    {student.section && ` - ${student.section.name}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/students/${student.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard title="Personal Information" icon={User}>
            <InfoGrid>
              <InfoItem label="First Name" value={student.firstName} />
              <InfoItem label="Last Name" value={student.lastName} />
              <InfoItem label="Date of Birth" value={formatDate(student.dateOfBirth)} />
              <InfoItem
                label="Gender"
                value={GENDER_LABELS[student.gender as Gender]}
              />
              <InfoItem label="Blood Group" value={student.bloodGroup?.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")} />
              <InfoItem label="Religion" value={student.religion} />
              <InfoItem label="Nationality" value={student.nationality} />
              <InfoItem label="Phone" value={student.phone} />
              <InfoItem label="Email" value={student.user.email} />
            </InfoGrid>
          </InfoCard>

          <InfoCard title="Academic Information" icon={GraduationCap}>
            <InfoGrid>
              <InfoItem label="Admission #" value={student.admissionNumber} />
              <InfoItem label="Admission Date" value={formatDate(student.admissionDate)} />
              <InfoItem label="Class" value={student.class?.name} />
              <InfoItem label="Section" value={student.section?.name} />
              <InfoItem label="Roll Number" value={student.rollNumber} />
            </InfoGrid>
          </InfoCard>

          <InfoCard title="Address" icon={MapPin}>
            <InfoGrid>
              <InfoItem label="Street" value={student.address} className="sm:col-span-2" />
              <InfoItem label="City" value={student.city} />
              <InfoItem label="State" value={student.state} />
              <InfoItem label="Country" value={student.country} />
              <InfoItem label="ZIP Code" value={student.zipCode} />
            </InfoGrid>
          </InfoCard>
        </div>

        {/* Parents */}
        <div>
          <InfoCard title="Parents / Guardians" icon={Users2}>
            {student.parents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No parent linked
              </p>
            ) : (
              <div className="space-y-4">
                {student.parents.map(({ parent, relation }) => (
                  <div key={parent.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {getInitials(`${parent.firstName} ${parent.lastName}`)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {parent.firstName} {parent.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{relation}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {parent.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {parent.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}