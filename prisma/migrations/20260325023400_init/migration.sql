-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "dateUtc" DATETIME NOT NULL,
    "forecast" TEXT,
    "previous" TEXT,
    "rawData" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "summarySent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_externalId_key" ON "CalendarEvent"("externalId");

-- CreateIndex
CREATE INDEX "CalendarEvent_dateUtc_idx" ON "CalendarEvent"("dateUtc");

-- CreateIndex
CREATE INDEX "CalendarEvent_isSelected_dateUtc_idx" ON "CalendarEvent"("isSelected", "dateUtc");
