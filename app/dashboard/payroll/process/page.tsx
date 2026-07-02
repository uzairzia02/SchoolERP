"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  getEmployeesForPayroll,
  bulkProcessPayrollAction,
  processPayrollAction,
} from "@/features/payroll/actions/payroll.actions";
import { ProcessPayrollForm } from "@/features/payroll/components/process-payroll-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote, CheckCircle, ArrowLeft, Loader2, PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getInitials } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type EmployeeForPayroll = Awaited<ReturnType<typeof getEmployeesForPayroll>>[0];

export default function ProcessPayrollPage() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<EmployeeForPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingEmployee, setProcessingEmployee] = useState<EmployeeForPayroll | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEmployeesForPayroll(selectedMonth, selectedYear).then((data) => {
      setEmployees(data);
      setLoading(false);
    });
  }, [selectedMonth, selectedYear]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    const unpaid = employees.filter((e) => !e.payroll).map((e) => e.id);
    if (selectedIds.length === unpaid.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpaid);
    }
  }

  async function handleBulkProcess() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one employee.");
      return;
    }

    setIsBulkProcessing(true);
    const result = await bulkProcessPayrollAction({
      month: selectedMonth,
      year: selectedYear,
      paymentMethod: "BANK_TRANSFER",
      employeeIds: selectedIds,
    });

    setIsBulkProcessing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Payroll processed.");
    setSelectedIds([]);
    getEmployeesForPayroll(selectedMonth, selectedYear).then(setEmployees);
  }

  return (
    <div className="space-y-6 page-enter">
      {processingEmployee && (
        <ProcessPayrollForm
          employee={processingEmployee}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => {
            setProcessingEmployee(null);
            getEmployeesForPayroll(selectedMonth, selectedYear).then(setEmployees);
          }}
        />
      )}

      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/payroll">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Process Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Process employee salaries for a specific month
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {selectedIds.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                size="sm"
                onClick={handleBulkProcess}
                disabled={isBulkProcessing}
                className="gap-2"
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="h-3.5 w-3.5" />
                )}
                Process Selected
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              onChange={toggleAll}
              checked={
                selectedIds.length > 0 &&
                selectedIds.length ===
                  employees.filter((e) => !e.payroll).length
              }
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Employee
            </span>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:block">
              Salary
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Action
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Banknote className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No employees found
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => toggleSelect(emp.id)}
                    disabled={!!emp.payroll}
                    className="h-4 w-4 rounded border-input disabled:opacity-40"
                  />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-600">
                    {getInitials(`${emp.firstName} ${emp.lastName}`)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emp.employeeId}
                      {emp.department && ` · ${emp.department.name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium hidden sm:block">
                    {emp.salary ? formatCurrency(emp.salary) : "—"}
                  </span>

                  {emp.payroll ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <Badge variant="default" className="text-[10px] bg-emerald-500">
                        Paid {formatCurrency(emp.payroll.netSalary)}
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Pending
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant={emp.payroll ? "outline" : "default"}
                    onClick={() => setProcessingEmployee(emp)}
                    className="text-xs gap-1"
                  >
                    <Banknote className="h-3 w-3" />
                    {emp.payroll ? "Update" : "Process"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}