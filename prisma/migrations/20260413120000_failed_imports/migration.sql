-- CreateTable
CREATE TABLE "failed_imports" (
    "id" UUID NOT NULL,
    "row" INTEGER NOT NULL,
    "flagName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_imports_pkey" PRIMARY KEY ("id")
);
