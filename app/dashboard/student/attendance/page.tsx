import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Attendance",
};

export default async function StudentAttendancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const student = await db.student.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      class: {
        select: {
          displayName: true,
        },
      },
      section: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="p-6">
        Student profile not found.
      </div>
    );
  }

  const attendance = await db.studentAttendance.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: {
      date: "desc",
    },
    take: 30,
    select: {
      id: true,
      date: true,
      status: true,
      remarks: true,
    },
  });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold font-display">
            My Attendance
          </h1>

          <p className="text-sm text-muted-foreground">
            {student.firstName} {student.lastName} -{" "}
            {student.class?.displayName} {student.section?.name}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b font-semibold">
          Attendance History
        </div>

        <div className="divide-y">
          {attendance.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No attendance record found.
            </div>
          ) : (
            attendance.map((record) => (
              <div
                key={record.id}
                className="flex justify-between items-center p-4"
              >
                <div>
                  <p className="font-medium">
                    {new Date(record.date).toLocaleDateString()}
                  </p>

                  {record.remarks && (
                    <p className="text-sm text-muted-foreground">
                      {record.remarks}
                    </p>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === "PRESENT"
                      ? "bg-green-100 text-green-700"
                      : record.status === "ABSENT"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {record.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}