import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { MonthGridSkeleton } from '@/components/calendar/MonthGridSkeleton'

function parseYearMonth(s: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(s)
  if (!m) return null
  const year = parseInt(m[1], 10)
  const month = parseInt(m[2], 10)
  if (month < 1 || month > 12) return null
  return { year, month }
}

function adjacentMonth(year: number, month: number, delta: 1 | -1): string {
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarMonthPage({ params }: { params: { yearMonth: string } }) {
  const parsed = parseYearMonth(params.yearMonth)

  if (!parsed) {
    const now = new Date()
    redirect(`/calendar/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }

  const { year, month } = parsed!

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky navigation header — renders immediately, no data dependency */}
      <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-100 px-4 md:px-8 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href={`/calendar/${adjacentMonth(year, month, -1)}`}
            aria-label="Previous month"
            className="p-2 rounded-md text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>

          <div className="text-center select-none">
            <span className="text-3xl font-light text-stone-800 tracking-tight">
              {MONTH_NAMES[month - 1]}
            </span>{' '}
            <span className="text-xl font-light text-stone-400">{year}</span>
          </div>

          <Link
            href={`/calendar/${adjacentMonth(year, month, 1)}`}
            aria-label="Next month"
            className="p-2 rounded-md text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ChevronRight size={24} />
          </Link>
        </div>
      </header>

      {/* Grid — streams in behind Suspense while MonthGrid fetches data */}
      <main className="mx-auto max-w-5xl px-2 md:px-8 py-4 md:py-6">
        <Suspense fallback={<MonthGridSkeleton year={year} month={month} />}>
          <MonthGrid year={year} month={month} />
        </Suspense>
      </main>
    </div>
  )
}
