-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "mostWantedName" TEXT,
    "mostWantedImageUrl" TEXT,
    "mostWantedAcquiredAt" TIMESTAMP(3),
    "mostWantedDescription" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
