import type { SubjectDetail } from "@/features/subjects/actions/subject.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Users, Pencil, GraduationCap, Hash, Clock,
} from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface SubjectDetailProps {
  subject: SubjectDetail;
}

export function SubjectDetailView({ subject }: SubjectDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
              <BookOpen className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">{subject.name}</h2>
              <p className="text-muted-foreground text-sm font-mono mt-0.5">
                {subject.code}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={subject.isActive ? "default" : "secondary"}>
                  {subject.isActive ? "Active" : "Inactive"}
                </Badge>
                {subject.class && (
                  <Badge variant="outline">{subject.class.displayName}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/subjects/${subject.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold font-display">{subject.code}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Code</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold font-display">{subject.creditHours}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Credit Hours</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold font-display">{subject._count.teachers}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Teachers</p>
            </div>
          </div>

          {/* Description */}
          {subject.description && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold font-display text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{subject.description}</p>
            </div>
          )}

          {/* Class */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold font-display text-sm">Class Assignment</h3>
            </div>
            {subject.class ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{subject.class.displayName}</Badge>
                <span className="text-xs text-muted-foreground">
                  This subject is assigned to {subject.class.displayName}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                General subject — available for all classes
              </p>
            )}
          </div>
        </div>

        {/* Teachers */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold font-display text-sm">Assigned Teachers</h3>
          </div>
          {subject.teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No teachers assigned</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign teachers from Teacher Management
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {subject.teachers.map(({ teacher }) => (
                <Link
                  key={teacher.id}
                  href={`/dashboard/teachers/${teacher.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                    {getInitials(`${teacher.firstName} ${teacher.lastName}`)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {teacher.employeeId}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}