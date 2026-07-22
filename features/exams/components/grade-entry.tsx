"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveGradesAction, getResultSheet } from "@/features/exams/actions/exam.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, BarChart3, Download } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ExamData = {
  id: string;
  classId: string;
  totalMarks: number;
  passingMarks: number;
  subjects: {
    id: string;
    totalMarks: number;
    passingMarks: number;
    subject: { id: string; name: string; code: string };
  }[];
};

type StudentData = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string | null;
  grades: {
    subjectId: string;
    marksObt: any;
    percentage: any;
    grade: string | null;
    gpa: any;
  }[];
};

interface GradeEntryProps {
  exam: ExamData;
  students: StudentData[];
}

export function GradeEntry({ exam, students }: GradeEntryProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingResult, setIsGeneratingResult] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any[]>([]);

  // Initialize marks from existing grades
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>(
    () => {
      const init: Record<string, Record<string, string>> = {};
      students.forEach((student) => {
        init[student.id] = {};
        exam.subjects.forEach((es) => {
          const existingGrade = student.grades.find(
            (g) => g.subjectId === es.subject.id
          );
          init[student.id][es.subject.id] = existingGrade
            ? String(Number(existingGrade.marksObt))
            : "";
        });
      });
      return init;
    }
  );

  function handleMarkChange(studentId: string, subjectId: string, value: string) {
    const num = parseFloat(value);
    const totalMarks =
      exam.subjects.find((s) => s.subject.id === subjectId)?.totalMarks ??
      exam.totalMarks;

    if (value !== "" && (num < 0 || num > totalMarks)) return;

    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subjectId]: value },
    }));
  }

  async function handleSave() {
    const grades: { studentId: string; subjectId: string; marksObt: number }[] = [];

    for (const [studentId, subjectMarks] of Object.entries(marks)) {
      for (const [subjectId, marksObt] of Object.entries(subjectMarks)) {
        if (marksObt !== "") {
          grades.push({
            studentId,
            subjectId,
            marksObt: parseFloat(marksObt),
          });
        }
      }
    }

    if (grades.length === 0) {
      toast.error("Enter at least one mark.");
      return;
    }

    setIsSaving(true);
    const result = await saveGradesAction({ examId: exam.id, grades });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message ?? "Grades saved.");
    router.refresh();
  }

  async function handleGenerateResult() {
    setIsGeneratingResult(true);
    const result = await getResultSheet(exam.id);
    setIsGeneratingResult(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setResultData(result.data);
    setShowResult(true);
  }

  function exportResultCSV() {
    if (resultData.length === 0) return;

    const subjectHeaders = exam.subjects.map((s) => s.subject.name).join(",");
    const headers = `Pos,Roll #,Name,Adm #,${subjectHeaders},Total,Percentage,Grade,GPA,Status`;

    const rows = resultData.map((row) => {
      const subjectMarks = exam.subjects
        .map((s) => {
          const g = row.grades.find((g: any) => g.subjectId === s.subject.id);
          return g?.marksObt ?? "AB";
        })
        .join(",");

      return `${row.position},${row.rollNumber ?? ""},${row.name},${row.admissionNumber},${subjectMarks},${row.totalMarksObt}/${row.totalMarks},${row.percentage}%,${row.grade},${row.gpa},${row.isPassed ? "PASS" : "FAIL"}`;
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result-sheet.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (showResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold font-display">Result Sheet</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportResultCSV} className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowResult(false)}>
              Back to Entry
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Pos</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Roll #</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Name</th>
                  {exam.subjects.map((s) => (
                    <th key={s.id} className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                      {s.subject.code}
                      <br />
                      <span className="text-[10px] normal-case">/{s.totalMarks}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Total</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">%</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Grade</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">GPA</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {resultData.map((row) => (
                  <tr
                    key={row.studentId}
                    className={cn(
                      "border-b last:border-0",
                      !row.isPassed ? "bg-red-500/5" : "hover:bg-muted/20"
                    )}
                  >
                    <td className="px-3 py-2.5 font-bold text-center">
                      {row.position === 1 ? "🥇" : row.position === 2 ? "🥈" : row.position === 3 ? "🥉" : row.position}
                    </td>
                    <td className="px-3 py-2.5 text-center">{row.rollNumber ?? "—"}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{row.name}</td>
                    {exam.subjects.map((s) => {
                      const g = row.grades.find((g: any) => g.subjectId === s.subject.id);
                      return (
                        <td key={s.id} className="px-3 py-2.5 text-center">
                          {g?.marksObt !== null && g?.marksObt !== undefined ? (
                            <span className={g.marksObt < s.passingMarks ? "text-red-600 font-bold" : "text-emerald-600 font-medium"}>
                              {g.marksObt}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">AB</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center font-medium">
                      {row.totalMarksObt}/{row.totalMarks}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold">
                      {row.percentage}%
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-primary">
                      {row.grade}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.gpa.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        variant={row.isPassed ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {row.isPassed ? "PASS" : "FAIL"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-emerald-600">
              {resultData.filter((r) => r.isPassed).length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Passed</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold font-display text-red-600">
              {resultData.filter((r) => !r.isPassed).length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Failed</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold font-display">
              {resultData.length > 0
                ? (
                    resultData.reduce((s, r) => s + r.percentage, 0) /
                    resultData.length
                  ).toFixed(1)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Class Average</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {students.length} students · {exam.subjects.length} subjects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateResult}
            disabled={isGeneratingResult}
            className="gap-1"
          >
            {isGeneratingResult ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BarChart3 className="h-3.5 w-3.5" />
            )}
            View Result Sheet
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Grades
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16">
          <p className="font-medium text-muted-foreground">No students in this class</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide sticky left-0 bg-muted/30">
                    Student
                  </th>
                  {exam.subjects.map((es) => (
                    <th
                      key={es.id}
                      className="px-3 py-3 text-center font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      {es.subject.code}
                      <br />
                      <span className="text-[10px] normal-case font-normal">
                        Max: {es.totalMarks} | Pass: {es.passingMarks}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-card">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {getInitials(`${student.firstName} ${student.lastName}`)}
                        </div>
                        <div>
                          <p className="font-medium text-xs whitespace-nowrap">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {student.admissionNumber}
                            {student.rollNumber && ` · Roll ${student.rollNumber}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    {exam.subjects.map((es) => {
                      const currentMark = marks[student.id]?.[es.subject.id] ?? "";
                      const numMark = parseFloat(currentMark);
                      const isPassing = !isNaN(numMark) && numMark >= es.passingMarks;
                      const isEntered = currentMark !== "";

                      return (
                        <td key={es.id} className="px-2 py-2.5 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={es.totalMarks}
                            step="0.5"
                            value={currentMark}
                            onChange={(e) =>
                              handleMarkChange(student.id, es.subject.id, e.target.value)
                            }
                            className={cn(
                              "h-8 w-20 text-center text-sm",
                              isEntered && isPassing && "border-emerald-400 bg-emerald-50 text-emerald-700",
                              isEntered && !isPassing && "border-red-400 bg-red-50 text-red-700"
                            )}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-muted/30 border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Green = Passing · Red = Failing · Empty = Absent
        </p>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Grades
        </Button>
      </div>
    </div>
  );
}