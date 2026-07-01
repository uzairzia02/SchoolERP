import type { EmployeeDetail } from "@/features/employees/actions/employee.actions";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Pencil, UserX } from "lucide-react";
import Link from "next/link";
import { GENDER_LABELS } from "@/constants/enums";
import type { Gender } from "@prisma/client";
import { EmployeeStatusDialog } from "@/features/employees/components/employee-status-dialog";

interface EmployeeDetailProps {
  employee: EmployeeDetail;
}

export function EmployeeDetailView({ employee }: EmployeeDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-xl font-bold text-orange-600">
              {getInitials(`${employee.firstName} ${employee.lastName}`)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {employee.employeeId}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={employee.isActive ? "default" : "secondary"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
                {employee.designation && (
                  <Badge variant="outline">{employee.designation.name}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EmployeeStatusDialog
              employeeId={employee.id}
              employeeName={`${employee.firstName} ${employee.lastName}`}
              isActive={employee.isActive}
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/employees/${employee.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <InfoCard title="Personal Information" icon={User}>
          <InfoGrid>
            <InfoItem label="First Name" value={employee.firstName} />
            <InfoItem label="Last Name" value={employee.lastName} />
            <InfoItem
              label="Gender"
              value={GENDER_LABELS[employee.gender as Gender]}
            />
            <InfoItem
              label="Date of Birth"
              value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : undefined}
            />
            <InfoItem label="Email" value={employee.email} />
            <InfoItem label="Phone" value={employee.phone} />
            <InfoItem
              label="Address"
              value={employee.address}
              className="col-span-2"
            />
          </InfoGrid>
        </InfoCard>

        {/* Employment Info */}
        <InfoCard title="Employment Information" icon={Briefcase}>
          <InfoGrid>
            <InfoItem label="Employee ID" value={employee.employeeId} />
            <InfoItem label="Joining Date" value={formatDate(employee.joiningDate)} />
            <InfoItem label="Department" value={employee.department?.name} />
            <InfoItem label="Designation" value={employee.designation?.name} />
            <InfoItem
              label="Monthly Salary"
              value={employee.salary ? formatCurrency(employee.salary) : undefined}
            />
          </InfoGrid>
        </InfoCard>

        {/* Offboarding Info */}
        {!employee.isActive && (
          <InfoCard title="Offboarding Information" icon={UserX}>
            <InfoGrid>
              <InfoItem
                label="Last Working Date"
                value={
                  employee.lastWorkingDate
                    ? formatDate(employee.lastWorkingDate)
                    : undefined
                }
              />
              <InfoItem
                label="Reason"
                value={employee.leavingReason}
                className="col-span-2"
              />
            </InfoGrid>
          </InfoCard>
        )}
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