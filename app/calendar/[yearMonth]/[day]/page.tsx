import { redirect } from 'next/navigation'
import { requireFamily } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DayDetailView } from '@/components/calendar/DayDetailView'
import type { PhotoItem } from '@/components/media/PhotoSection'
import type { VideoItem } from '@/components/media/VideoSection'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ParsedDate = { year: number; month: number; day: number; iso: string }

function parseDate(yearMonth: string, day: string): ParsedDate | null {
  const ymMatch = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  const dMatch = /^(\d{1,2})$/.exec(day)
  if (!ymMatch || !dMatch) return null

  const year = parseInt(ymMatch[1], 10)
  const month = parseInt(ymMatch[2], 10)
  const d = parseInt(dMatch[1], 10)

  if (month < 1 || month > 12) return null
  if (d < 1 || d > 31) return null

  // Validate real date — new Date(UTC) will roll over invalid dates
  const dateUTC = new Date(Date.UTC(year, month - 1, d))
  if (
    dateUTC.getUTCFullYear() !== year ||
    dateUTC.getUTCMonth() + 1 !== month ||
    dateUTC.getUTCDate() !== d
  ) {
    return null
  }

  const iso = `${String(year)}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { year, month, day: d, iso }
}

function formatHeading(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function formatBreadcrumb(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1))
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type PageProps = {
  params: { yearMonth: string; day: string }
}

export default async function CalendarDayPage({ params }: PageProps) {
  const { yearMonth, day } = params

  const parsed = parseDate(yearMonth, day)
  if (!parsed) {
    const now = new Date()
    redirect(
      `/calendar/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    )
  }

  const { year, month, day: dayNum, iso } = parsed!
  const { familyId } = await requireFamily()
  const dateUTC = new Date(`${iso}T00:00:00.000Z`)

  // Fetch DayEntry + color ranges in parallel (async-parallel rule)
  const [dayEntry, colorRanges] = await Promise.all([
    prisma.dayEntry.findUnique({
      where: { familyId_date: { familyId, date: dateUTC } },
      select: {
        eventText: true,
        photos: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, cloudinaryUrl: true, name: true },
        },
        videos: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, cloudinaryUrl: true, thumbnailUrl: true, name: true },
        },
        journal: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.dayColorRange.findMany({
      where: {
        familyId,
        startDate: { lte: dateUTC },
        endDate: { gte: dateUTC },
      },
      orderBy: { createdAt: 'asc' },
      select: { colorHex: true },
    }),
  ])

  // Latest-created range wins
  const activeColorHex = colorRanges.length > 0
    ? colorRanges[colorRanges.length - 1].colorHex
    : null

  // Serialize only needed fields to client (server-serialization rule)
  type RawPhoto = { id: string; cloudinaryUrl: string; name: string }
  type RawVideo = { id: string; cloudinaryUrl: string; thumbnailUrl: string | null; name: string }

  const initialPhotos: PhotoItem[] = (dayEntry?.photos ?? [] as RawPhoto[]).map(
    (p: RawPhoto) => ({ id: p.id, cloudinaryUrl: p.cloudinaryUrl, name: p.name }),
  )

  const initialVideos: VideoItem[] = (dayEntry?.videos ?? [] as RawVideo[]).map(
    (v: RawVideo) => ({
      id: v.id,
      cloudinaryUrl: v.cloudinaryUrl,
      thumbnailUrl: v.thumbnailUrl ?? '',
      name: v.name,
    }),
  )

  return (
    <DayDetailView
      date={iso}
      yearMonth={yearMonth}
      heading={formatHeading(year, month, dayNum)}
      breadcrumb={formatBreadcrumb(year, month)}
      initialEventText={dayEntry?.eventText ?? null}
      initialPhotos={initialPhotos}
      initialVideos={initialVideos}
      initialJournal={dayEntry?.journal ?? null}
      initialColorHex={activeColorHex}
    />
  )
}
