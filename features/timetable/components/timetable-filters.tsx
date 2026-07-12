"use client";

interface TimetableFiltersProps {
  classes: { id: string; displayName: string }[];
  sections: { id: string; name: string }[];
  selectedClassId: string;
  selectedSectionId?: string;
}

export function TimetableFilters({
  classes,
  sections,
  selectedClassId,
  selectedSectionId,
}: TimetableFiltersProps) {
  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href);
    url.searchParams.set("classId", e.target.value);
    url.searchParams.delete("sectionId");
    window.location.href = url.toString();
  }

  function handleSectionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href);
    url.searchParams.set("sectionId", e.target.value);
    window.location.href = url.toString();
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <form className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Class</label>
          <select
            name="classId"
            defaultValue={selectedClassId}
            onChange={handleClassChange}
            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.displayName}</option>
            ))}
          </select>
        </div>

        {sections.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Section</label>
            <select
              name="sectionId"
              defaultValue={selectedSectionId ?? ""}
              onChange={handleSectionChange}
              className="flex h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>Section {s.name}</option>
              ))}
            </select>
          </div>
        )}
      </form>
    </div>
  );
}
