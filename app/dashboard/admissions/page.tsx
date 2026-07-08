import type { Metadata } from "next";
import { UserPlus, Clock, CheckCircle, Users, XCircle } from "lucide-react";
import {
  getAdmissions,
  getAdmissionSummary,
} from "@/features/admissions/actions/admission.actions";
import { AdmissionTable } from "@/features/admissions/components/admission-table";
import type { AdmissionStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Admissions" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [admissionsData, summary] = await Promise.all([
    getAdmissions({
      page: params.page ? parseInt(params.page) : 1,
      search: params.search,
      status: params.status as AdmissionStatus | undefined,
    }),
    getAdmissionSummary(),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <UserPlus className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Admissions</h1>
          <p className="text-sm text-muted-foreground">
            Manage student admission applications
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Applied", value: summary.applied, icon: UserPlus, color: "bg-blue-500" },
          { label: "Under Review", value: summary.underReview, icon: Clock, color: "bg-yellow-500" },
          { label: "Accepted", value: summary.accepted, icon: CheckCircle, color: "bg-emerald-500" },
          { label: "Enrolled", value: summary.enrolled, icon: Users, color: "bg-violet-500" },
          { label: "Rejected", value: summary.rejected, icon: XCircle, color: "bg-red-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color} mb-3`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold font-display">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      <AdmissionTable initialData={admissionsData} />
    </div>
  );
}