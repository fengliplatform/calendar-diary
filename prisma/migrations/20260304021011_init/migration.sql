-- CreateTable
CREATE TABLE "DayEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "eventText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayColorRange" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "colorHex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayColorRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "dayEntryId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "dayEntryId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "dayEntryId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayEntry_familyId_idx" ON "DayEntry"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_familyId_date_key" ON "DayEntry"("familyId", "date");

-- CreateIndex
CREATE INDEX "DayColorRange_familyId_idx" ON "DayColorRange"("familyId");

-- CreateIndex
CREATE INDEX "Photo_familyId_idx" ON "Photo"("familyId");

-- CreateIndex
CREATE INDEX "Photo_dayEntryId_idx" ON "Photo"("dayEntryId");

-- CreateIndex
CREATE INDEX "Video_familyId_idx" ON "Video"("familyId");

-- CreateIndex
CREATE INDEX "Video_dayEntryId_idx" ON "Video"("dayEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_dayEntryId_key" ON "Journal"("dayEntryId");

-- CreateIndex
CREATE INDEX "Journal_familyId_idx" ON "Journal"("familyId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (Postgres full-text search)
-- Journal: search across title and Tiptap JSON content
CREATE INDEX idx_journal_fts ON "Journal" USING GIN (
  to_tsvector('english', title || ' ' || content::text)
);

-- DayEntry: search across eventText (nullable → coalesce to empty string)
CREATE INDEX idx_dayentry_fts ON "DayEntry" USING GIN (
  to_tsvector('english', coalesce("eventText", ''))
);
