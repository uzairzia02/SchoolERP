import type { Metadata } from "next";
import { Users2, UserCheck, UserX, GraduationCap } from "lucide-react";
import { getParents, getParentSummary } from "@/features/parents/actions/parent.actions";
import { ParentTable } from "@/features/parents/components/parent-table";

export const metadata: Metadata = { title: "Parents" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    isActive?: string;
  }>;
}

export default async function ParentsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [data, summary] = await Promise.all([
    getParents({
      page: params.page ? parseInt(params.page) : 1,
      search: params.search,
      isActive:
        params.isActive === "true"
          ? true
          : params.isActive === "false"
          ? false
          : undefined,
    }),
    getParentSummary(),
  ]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
          <Users2 className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Parents</h1>
          <p className="text-sm text-muted-foreground">
            Parent accounts linked to enrolled students
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Parents", value: summary.total, icon: Users2, color: "bg-teal-500" },
          { label: "Active", value: summary.active, icon: UserCheck, color: "bg-emerald-500" },
          { label: "Inactive", value: summary.inactive, icon: UserX, color: "bg-red-500" },
          { label: "With Children", value: summary.withMultipleChildren, icon: GraduationCap, color: "bg-blue-500" },
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

      <ParentTable initialData={data} />
    </div>
  );
}