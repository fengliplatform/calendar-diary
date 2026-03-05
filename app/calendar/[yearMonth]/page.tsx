import { Suspense } from 'react'
import { redirect } from 'next/navigation'
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

export default function CalendarMonthPage({ params }: { params: { yearMonth: string } }) {
  const parsed = parseYearMonth(params.yearMonth)

  if (!parsed) {
    const now = new Date()
    redirect(`/calendar/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }

  const { year, month } = parsed!

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Grid — streams in behind Suspense while MonthGrid fetches data */}
      <main className="mx-auto max-w-5xl px-2 md:px-8 py-4 md:py-6 animate-in fade-in-0 duration-300">
        <Suspense fallback={<MonthGridSkeleton year={year} month={month} />}>
          <MonthGrid year={year} month={month} />
        </Suspense>
      </main>
    </div>
  )
}
