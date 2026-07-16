/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,routeNumber]` on the table `transport` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "transport_schoolId_routeNumber_key" ON "transport"("schoolId", "routeNumber");
