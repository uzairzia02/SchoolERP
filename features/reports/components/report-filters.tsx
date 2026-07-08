"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";

interface FilterField {
  key: string;
  label: string;
  type: "date" | "select" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface ReportFiltersProps {
  fields: FilterField[];
  onExportCSV?: () => void;
  onPrint?: () => void;
}

export function ReportFilters({
  fields,
  onExportCSV,
  onPrint,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") current.delete(key);
        else current.set(key, value);
      });
      return current.toString();
    },
    [searchParams]
  );

  function handleChange(key: string, value: string) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value || null })}`);
    });
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {onExportCSV && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExportCSV}
              className="gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
          {onPrint && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPrint}
              className="gap-2"
            >
              Print
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs">{field.label}</Label>
            {field.type === "select" ? (
              <select
                defaultValue={searchParams.get(field.key) ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={field.type}
                defaultValue={searchParams.get(field.key) ?? ""}
                placeholder={field.placeholder}
                className="h-9 text-sm"
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}