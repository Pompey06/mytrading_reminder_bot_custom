-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "dateUtc" DATETIME NOT NULL,
    "forecast" TEXT,
    "previous" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "summarySent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
