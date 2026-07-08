"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteAssignment } from "../actions/assignment.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AssignmentRow {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacherName: string;
  dueDate: Date | string;
  totalMarks: number | null;
  submissionCount: number;
  isActive: boolean;
}

export function AssignmentTable({ data, showTeacherColumn = false }: { data: AssignmentRow[]; showTeacherColumn?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteAssignment(deleteId);
      if (result.success) {
        toast.success("Assignment deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
      setDeleteId(null);
    });
  }

  const isOverdue = (dueDate: Date | string) => new Date(dueDate) < new Date();

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
        No assignments found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              {showTeacherColumn && <TableHead>Teacher</TableHead>}
              <TableHead>Due Date</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell>{a.className}</TableCell>
                <TableCell>{a.subject}</TableCell>
                {showTeacherColumn && <TableCell>{a.teacherName}</TableCell>}
                <TableCell>
                  <span className={isOverdue(a.dueDate) ? "text-red-600" : ""}>
                    {formatDate(a.dueDate)}
                  </span>
                </TableCell>
                <TableCell>{a.submissionCount}</TableCell>
                <TableCell>
                  {a.isActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-0 font-normal">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-500/10 text-gray-700 border-0 font-normal">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link href={`/dashboard/assignments/${a.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link href={`/dashboard/assignments/${a.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(a.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the assignment for all students. Existing submissions will be preserved but hidden. This action can be reversed by an administrator only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
