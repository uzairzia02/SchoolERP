-- CreateTable
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "currentSession" TEXT NOT NULL DEFAULT '2025-2026',
    "sessionStartDate" TIMESTAMP(3),
    "sessionEndDate" TIMESTAMP(3),
    "termsCount" INTEGER NOT NULL DEFAULT 3,
    "gradingSystem" JSONB,
    "passingMarks" INTEGER NOT NULL DEFAULT 33,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankBranch" TEXT,
    "smsApiKey" TEXT,
    "smsApiUrl" TEXT,
    "smsMasking" TEXT,
    "smsAbsentTemplate" TEXT,
    "smsFeeTemplate" TEXT,
    "smsResultTemplate" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "session" TEXT NOT NULL,
    "weightage" INTEGER NOT NULL DEFAULT 33,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scales" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minMarks" INTEGER NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_settings_schoolId_key" ON "school_settings"("schoolId");

-- CreateIndex
CREATE INDEX "terms_schoolId_idx" ON "terms"("schoolId");

-- CreateIndex
CREATE INDEX "grade_scales_schoolId_idx" ON "grade_scales"("schoolId");

-- CreateIndex
CREATE INDEX "houses_schoolId_idx" ON "houses"("schoolId");

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
