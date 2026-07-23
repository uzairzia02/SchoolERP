"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Search, Download, Calendar, RefreshCw } from "lucide-react";

interface StaffAttendanceRecord {
  id: string;
  status: string;
  checkIn: Date | null;
  checkOut: Date | null;
  date?: Date | string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { name: string } | null;
    designation?: { name: string } | null;
  } | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { name: string } | null;
    designation?: { name: string } | null;
  } | null;
}

interface StaffAttendanceReportProps {
  data: StaffAttendanceRecord[];
  startDate: string;
  endDate: string;
}

export function StaffAttendanceReport({ data, startDate, endDate }: StaffAttendanceReportProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // 1️⃣ PEHLE filtered declare karo
  const filtered = useMemo(() => {
    return data.filter((record) => {
      const staff = record.teacher ?? record.employee;
      const name = staff ? `${staff.firstName} ${staff.lastName}`.toLowerCase() : "";
      const type = record.teacher ? "Teacher" : "Employee";
      
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;
      const matchesType = typeFilter === "ALL" || type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [data, search, statusFilter, typeFilter]);

  // 2️⃣ Phir handleExportCSV — ab filtered available hai
  const handleExportCSV = useCallback(() => {
    const headers = ["Date", "Staff Name", "ID", "Type", "Department", "Designation", "Status", "Check In", "Check Out"];
    
    const rows = filtered.map((record) => {
      const staff = record.teacher ?? record.employee;
      const name = staff ? `${staff.firstName} ${staff.lastName}` : "—";
      const staffId = record.teacher?.employeeId ?? record.employee?.employeeId ?? "—";
      const type = record.teacher ? "Teacher" : "Employee";
      const department = staff?.department?.name || "—";
      const designation = staff?.designation?.name || "—";
      const dateStr = record.date 
        ? new Date(record.date).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "—";
      const checkIn = record.checkIn
        ? new Date(record.checkIn).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
      const checkOut = record.checkOut
        ? new Date(record.checkOut).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";

      return [dateStr, name, staffId, type, department, designation, record.status, checkIn, checkOut];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `staff-attendance-${startDate}-to-${endDate}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filtered, startDate, endDate]);

  // 3️⃣ handleApplyFilter
  const handleApplyFilter = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "staff");
    params.set("startDate", localStartDate);
    params.set("endDate", localEndDate);
    router.push(`?${params.toString()}`);
  }, [localStartDate, localEndDate, router]);

  // Stats
  const total = data.length;
  const present = data.filter((r) => r.status === "PRESENT").length;
  const absent = data.filter((r) => r.status === "ABSENT").length;
  const late = data.filter((r) => r.status === "LATE").length;
  const halfDay = data.filter((r) => r.status === "HALF_DAY").length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const formatDateDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Staff", value: total, color: "bg-blue-500" },
          { label: "Present", value: present, color: "bg-emerald-500" },
          { label: "Absent", value: absent, color: "bg-red-500" },
          { label: "Late", value: late, color: "bg-yellow-500" },
          { label: "Half Day", value: halfDay, color: "bg-orange-500" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className={`h-2 w-2 rounded-full ${card.color} mb-2`} />
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Staff Attendance Rate ({formatDateDisplay(startDate)} — {formatDateDisplay(endDate)})
            </p>
            <p className={`text-2xl font-bold ${rate >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>
              {rate}%
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${rate >= 80 ? "bg-emerald-500" : "bg-yellow-500"}`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start Date
              </label>
              <Input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                End Date
              </label>
              <Input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyFilter}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PRESENT">Present</SelectItem>
            <SelectItem value="ABSENT">Absent</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="HALF_DAY">Half Day</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="Teacher">Teachers</SelectItem>
            <SelectItem value="Employee">Employees</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-1 ml-auto"
          disabled={filtered.length === 0}
        >
          <Download className="h-3 w-3" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No staff attendance records found for selected date range
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Staff Name</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">ID</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Department</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Designation</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Check In</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((record) => {
                    const staff = record.teacher ?? record.employee;
                    const staffType = record.teacher ? "Teacher" : "Employee";
                    const staffId = record.teacher?.employeeId ?? record.employee?.employeeId;

                    return (
                      <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">
                          {record.date 
                            ? new Date(record.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-medium">
                          {staff ? `${staff.firstName} ${staff.lastName}` : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">
                          {staffId || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              staffType === "Teacher"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {staffType}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-xs">
                          {staff?.department?.name || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-xs">
                          {staff?.designation?.name || "—"}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            className={`text-[10px] ${
                              record.status === "PRESENT"
                                ? "bg-emerald-500 text-white"
                                : record.status === "ABSENT"
                                ? "bg-red-500 text-white"
                                : record.status === "LATE"
                                ? "bg-yellow-500 text-white"
                                : record.status === "HALF_DAY"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {record.status?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">
                          {record.checkIn
                            ? new Date(record.checkIn).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">
                          {record.checkOut
                            ? new Date(record.checkOut).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}