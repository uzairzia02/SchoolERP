"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSectionAction } from "@/features/classes/actions/class.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, Layers } from "lucide-react";
import { SectionFormDialog } from "@/features/classes/components/section-form-dialog";

interface SectionListProps {
  classId: string;
  sections: {
    id: string;
    name: string;
    capacity: number;
    isActive: boolean;
    _count: { students: number };
  }[];
  canEdit?: boolean;
}

export function SectionList({ classId, sections, canEdit = false }: SectionListProps) {
  const router = useRouter();

  async function handleDelete(sectionId: string, name: string) {
    if (!confirm(`Delete section "${name}"?`)) return;
    const result = await deleteSectionAction(sectionId);
    if (result.success) {
      toast.success("Section deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold font-display text-sm">Sections</h3>
        </div>
        {canEdit && <SectionFormDialog classId={classId} />}
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Layers className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No sections yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canEdit ? "Add a section to organize students" : "No sections have been added"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => {
            const fillRate = Math.round(
              (section._count.students / section.capacity) * 100
            );
            return (
              <div
                key={section.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {section.name}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Section {section.name}</p>
                      <Badge
                        variant={section.isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {section.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3" />
                      {section._count.students} / {section.capacity} students
                      <span
                        className={
                          fillRate >= 90
                            ? "text-red-500 font-medium ml-1"
                            : fillRate >= 70
                            ? "text-yellow-600 font-medium ml-1"
                            : "ml-1"
                        }
                      >
                        ({fillRate}%)
                      </span>
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(section.id, section.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}