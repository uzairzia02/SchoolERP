import type { TeacherDetail } from "@/features/teachers/actions/teacher.actions";
import { formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Briefcase, BookOpen, Pencil, Mail, Phone, UserX } from "lucide-react";
import Link from "next/link";
import { GENDER_LABELS } from "@/constants/enums";
import type { Gender } from "@prisma/client";
import { TeacherStatusDialog } from "@/features/teachers/components/teacher-status-dialog";


interface TeacherDetailProps {
  teacher: TeacherDetail;
}

export function TeacherDetailView({ teacher }: TeacherDetailProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl font-bold text-emerald-600">
              {getInitials(`${teacher.firstName} ${teacher.lastName}`)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">{teacher.employeeId}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={teacher.isActive ? "default" : "secondary"}>
                  {teacher.isActive ? "Active" : "Inactive"}
                </Badge>
                {teacher.designation && <Badge variant="outline">{teacher.designation.name}</Badge>}
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <TeacherStatusDialog
              teacherId={teacher.id}
              teacherName={`${teacher.firstName} ${teacher.lastName}`}
              isActive={teacher.isActive}
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InfoCard title="Personal Information" icon={User}>
            <InfoGrid>
              <InfoItem label="First Name" value={teacher.firstName} />
              <InfoItem label="Last Name" value={teacher.lastName} />
              <InfoItem label="Gender" value={GENDER_LABELS[teacher.gender as Gender]} />
              <InfoItem label="Date of Birth" value={teacher.dateOfBirth ? formatDate(teacher.dateOfBirth) : undefined} />
              <InfoItem label="Email" value={teacher.email} />
              <InfoItem label="Phone" value={teacher.phone} />
              <InfoItem label="Address" value={teacher.address} className="sm:col-span-2" />
            </InfoGrid>
          </InfoCard>
        
        {!teacher.isActive && (
          <InfoCard title="Offboarding Information" icon={UserX}>
            <InfoGrid>
              <InfoItem
                label="Last Working Date"
                value={teacher.lastWorkingDate ? formatDate(teacher.lastWorkingDate) : undefined}
              />
              <InfoItem label="Reason" value={teacher.leavingReason} className="sm:col-span-2" />
            </InfoGrid>
          </InfoCard>
)}

          <InfoCard title="Employment Information" icon={Briefcase}>
            <InfoGrid>
              <InfoItem label="Employee ID" value={teacher.employeeId} />
              <InfoItem label="Joining Date" value={formatDate(teacher.joiningDate)} />
              <InfoItem label="Department" value={teacher.department?.name} />
              <InfoItem label="Designation" value={teacher.designation?.name} />
              <InfoItem label="Qualification" value={teacher.qualification} />
              <InfoItem label="Experience" value={teacher.experience ? `${teacher.experience} years` : undefined} />
            </InfoGrid>
          </InfoCard>
        </div>

        <div>
          <InfoCard title="Subjects Taught" icon={BookOpen}>
            {teacher.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No subjects assigned
              </p>
            ) : (
              <div className="space-y-2">
                {teacher.subjects.map(({ subject }) => (
                  <div key={subject.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <Badge variant="outline" className="text-[10px]">{subject.code}</Badge>
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