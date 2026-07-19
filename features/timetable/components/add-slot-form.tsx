"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { createTimetableSlotAction } from "@/features/timetable/actions/timetable.actions";
import { getClassesForSelect, getSectionsForSelect } from "@/features/students/actions/student.actions";
import { getSubjects } from "@/features/subjects/actions/subject.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPeriodsForSelect } from "@/features/periods/actions/period.actions";

type Option = { id: string; name: string; displayName?: string };
type TeacherOption = { id: string; firstName: string; lastName: string };

interface AddSlotFormProps {
  teachers: TeacherOption[];
}

const [periods, setPeriods] = useState([]);

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
];

const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30",
];

export function AddSlotForm({ teachers }: AddSlotFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);

  const [form, setForm] = useState({
    classId: "",
    sectionId: "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: "MONDAY",
    startTime: "08:00",
    endTime: "09:00",
    room: "",
  });

  useEffect(() => {
    getClassesForSelect().then(setClasses);
  }, []);

  useEffect(() => {
    if (form.classId) {
      getSectionsForSelect(form.classId).then(setSections);
      getSubjects({ classId: form.classId, pageSize: 100 }).then((r) =>
        setSubjects(r.data.map((s) => ({ id: s.id, name: s.name })))
      );
      setForm((prev) => ({ ...prev, sectionId: "", subjectId: "" }));
    }
  }, [form.classId]);

  async function handleSubmit() {
    if (!form.classId || !form.subjectId || !form.teacherId || !form.dayOfWeek) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    const result = await createTimetableSlotAction({
      ...form,
      sectionId: form.sectionId || undefined,
      room: form.room || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Period added to timetable.");
    setOpen(false);
    setForm({
      classId: "",
      sectionId: "",
      subjectId: "",
      teacherId: "",
      dayOfWeek: "MONDAY",
      periodId: "",
      room: "",
    });
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Add Period
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card border shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold font-display">Add Period</h3>
          <button onClick={() => setOpen(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Day *</Label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Start Time *</Label>
            <select
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">End Time *</Label>
            <select
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Class *</Label>
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName ?? c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Section</Label>
            <select
              value={form.sectionId}
              onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
              disabled={!form.classId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              disabled={!form.classId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Teacher *</Label>
            <select
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Room / Location</Label>
            <Input
              placeholder="e.g. Room 12, Science Lab"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1">
            {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
            Add Period
          </Button>
        </div>
      </div>
    </div>
  );
}