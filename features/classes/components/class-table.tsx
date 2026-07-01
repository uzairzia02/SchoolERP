"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ClassListItem } from "@/features/classes/actions/class.actions";
import { deleteClassAction } from "@/features/classes/actions/class.actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreHorizontal, Eye, Pencil, Trash2, BookOpen,
  Users, Layers,
} from "lucide-react";

interface ClassTableProps {
  classes: ClassListItem[];
}

export function ClassTable({ classes }: ClassTableProps) {
  const router = useRouter();

  async function handleDelete(cls: ClassListItem) {
    if (!confirm(`Delete "${cls.displayName}"? This cannot be undone.`)) return;
    const result = await deleteClassAction(cls.id);
    if (result.success) {
      toast.success("Class deleted successfully.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {classes.length} {classes.length === 1 ? "class" : "classes"} total
        </p>
        <Button asChild>
          <Link href="/dashboard/classes/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Link>
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No classes yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Add your first class to start organizing students
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/classes/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Class
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold font-display">
                    {cls.name}
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/classes/${cls.id}`}
                      className="font-semibold font-display hover:text-primary transition-colors"
                    >
                      {cls.displayName}
                    </Link>
                    <Badge
                      variant={cls.isActive ? "default" : "secondary"}
                      className="ml-2 text-[10px]"
                    >
                      {cls.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/classes/${cls.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/classes/${cls.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(cls)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-bold font-display">{cls._count.students}</p>
                  <p className="text-[10px] text-muted-foreground">Students</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Layers className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-bold font-display">{cls._count.sections}</p>
                  <p className="text-[10px] text-muted-foreground">Sections</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <BookOpen className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-bold font-display">{cls._count.subjects}</p>
                  <p className="text-[10px] text-muted-foreground">Subjects</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}