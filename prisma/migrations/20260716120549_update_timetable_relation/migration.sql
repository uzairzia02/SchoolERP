/*
  Warnings:

  - You are about to drop the column `endTime` on the `timetables` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `timetables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classId,sectionId,dayOfWeek,periodId]` on the table `timetables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodId` to the `timetables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "timetables" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "periodId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "timetables_teacherId_idx" ON "timetables"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "timetables_classId_sectionId_dayOfWeek_periodId_key" ON "timetables"("classId", "sectionId", "dayOfWeek", "periodId");

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
