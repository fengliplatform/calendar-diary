import { Sparkles } from 'lucide-react'
import { requireFamily } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLunarInfo } from '@/lib/lunar'
import { getHolidayName } from '@/lib/holidays'
import { DayCell } from '@/components/calendar/DayCell'
import type { DayCellProps } from '@/components/calendar/DayCell'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export async function MonthGrid({ year, month }: { year: number; month: number }) {
  const { familyId } = await requireFamily()

  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0)) // day 0 of next month = last day of this month

  const [dayEntries, colorRanges] = await Promise.all([
    prisma.dayEntry.findMany({
      where: {
        familyId,
        date: { gte: firstDay, lte: lastDay },
      },
      select: {
        date: true,
        eventText: true,
        _count: { select: { photos: true, videos: true } },
        journal: { select: { id: true, title: true } },
      },
    }),
    prisma.dayColorRange.findMany({
      where: {
        familyId,
        startDate: { lte: lastDay },
        endDate: { gte: firstDay },
      },
      orderBy: { createdAt: 'asc' }, // oldest first — later overwrites in loop (latest-created wins)
    }),
  ])

  // Build color map: latest-created range wins for any given day
  const colorMap = new Map<string, string>()
  for (const range of colorRanges) {
    let d = new Date(Math.max(range.startDate.getTime(), firstDay.getTime()))
    const end = new Date(Math.min(range.endDate.getTime(), lastDay.getTime()))
    while (d <= end) {
      colorMap.set(d.toISOString().slice(0, 10), range.colorHex)
      d = new Date(d.getTime() + 86_400_000)
    }
  }

  // Build day entry lookup map
  const dayMap = new Map(
    dayEntries.map((e) => [e.date.toISOString().slice(0, 10), e])
  )

  // Grid geometry
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalSlots = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7
  const trailingBlanks = totalSlots - firstDayOfWeek - daysInMonth

  const cells: Array<DayCellProps | null> = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateKey = toDateKey(year, month, day)
      const entry = dayMap.get(dateKey)
      const { label: lunarLabel, mode: lunarMode } = getLunarInfo(year, month, day)
      return {
        day,
        dateKey,
        eventText: entry?.eventText ?? null,
        photoCount: entry?._count.photos ?? 0,
        videoCount: entry?._count.videos ?? 0,
        journal: entry?.journal ?? null,
        colorHex: colorMap.get(dateKey) ?? null,
        lunarLabel,
        lunarMode,
        holidayName: getHolidayName(year, month, day),
      }
    }),
    ...Array(trailingBlanks).fill(null),
  ]

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs uppercase tracking-widest text-stone-400 py-2 select-none"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-stone-100">
        {cells.map((cell, i) =>
          cell === null ? (
            <div
              key={`blank-${i}`}
              className="border-r border-b border-stone-100 bg-stone-50/50 h-16 md:h-28"
            />
          ) : (
            <DayCell key={cell.dateKey} {...cell} />
          )
        )}
      </div>

      {/* Empty month state */}
      {dayEntries.length === 0 && (
        <div className="py-16 text-center" aria-label="No entries this month">
          <Sparkles className="mx-auto mb-3 text-stone-200" size={36} />
          <p className="font-medium text-stone-500">Start capturing memories</p>
          <p className="text-sm text-stone-400 mt-1">
            Tap any day to add notes, photos, or a journal entry.
          </p>
        </div>
      )}
    </div>
  )
}
