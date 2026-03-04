import { prisma } from '@/lib/db'

export interface FtsResult {
  dayEntryId: string
  date: string // YYYY-MM-DD
  eventText: string | null
  journalId: string | null
  journalTitle: string | null
  matchedField: string
  rank: number
}

export interface FuzzyItem {
  dayEntryId: string
  date: string // YYYY-MM-DD
  photoNames: string[]
  videoNames: string[]
  title: string // journal title, matches CLAUDE.md Fuse key "title"
  journalId: string | null
}

type RawFtsRow = {
  dayEntryId: string
  date: Date | string
  eventText: string | null
  journalId: string | null
  journalTitle: string | null
  matchedField: string
  rank: unknown
}

export async function runFtsSearch(
  familyId: string,
  query: string,
  from: string, // YYYY-MM-DD
  to: string,   // YYYY-MM-DD
): Promise<FtsResult[]> {
  const rows = await prisma.$queryRaw<RawFtsRow[]>`
    SELECT
      de.id AS "dayEntryId",
      de.date,
      de."eventText",
      j.id AS "journalId",
      j.title AS "journalTitle",
      ts_rank(
        to_tsvector('english',
          COALESCE(de."eventText", '') || ' ' ||
          COALESCE(j.title, '') || ' ' ||
          COALESCE(j.content::text, '')
        ),
        plainto_tsquery('english', ${query})
      ) AS rank,
      CASE
        WHEN to_tsvector('english', COALESCE(de."eventText", '')) @@ plainto_tsquery('english', ${query})
          THEN 'eventText'
        WHEN to_tsvector('english', COALESCE(j.title, '')) @@ plainto_tsquery('english', ${query})
          THEN 'journalTitle'
        ELSE 'journalContent'
      END AS "matchedField"
    FROM "DayEntry" de
    LEFT JOIN "Journal" j ON j."dayEntryId" = de.id
    WHERE de."familyId" = ${familyId}
      AND de.date >= ${from}::date
      AND de.date <= ${to}::date
      AND (
        to_tsvector('english',
          COALESCE(de."eventText", '') || ' ' ||
          COALESCE(j.title, '') || ' ' ||
          COALESCE(j.content::text, '')
        ) @@ plainto_tsquery('english', ${query})
      )
    ORDER BY rank DESC
    LIMIT 50
  `

  return rows.map(r => ({
    dayEntryId: r.dayEntryId,
    date:
      r.date instanceof Date
        ? r.date.toISOString().split('T')[0]
        : String(r.date).split('T')[0],
    eventText: r.eventText,
    journalId: r.journalId,
    journalTitle: r.journalTitle,
    matchedField: r.matchedField,
    rank: Number(r.rank),
  }))
}

export async function fetchFuzzyData(
  familyId: string,
  from: string, // YYYY-MM-DD
  to: string,   // YYYY-MM-DD
): Promise<FuzzyItem[]> {
  const entries = await prisma.dayEntry.findMany({
    where: {
      familyId,
      date: { gte: new Date(from), lte: new Date(to) },
    },
    select: {
      id: true,
      date: true,
      photos: { select: { name: true } },
      videos: { select: { name: true } },
      journal: { select: { id: true, title: true } },
    },
    orderBy: { date: 'desc' },
  })

  return entries.map(e => ({
    dayEntryId: e.id,
    date: e.date.toISOString().split('T')[0],
    photoNames: e.photos.map(p => p.name),
    videoNames: e.videos.map(v => v.name),
    title: e.journal?.title ?? '',
    journalId: e.journal?.id ?? null,
  }))
}
