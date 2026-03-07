// Server-only — import only in server components or server actions.
import { Solar } from 'lunar-javascript'

type CalendarEntry = {
  calendar: 'lunar' | 'gregorian'
  month: number
  day: number
  label: string // full display string including emoji
}

const ENTRIES: CalendarEntry[] = [
  // ── Lunar Jan ──────────────────────────────────────────
  { calendar: 'lunar', month: 1,  day: 1,  label: "🎂 立芝's Birthday" },
  { calendar: 'lunar', month: 1,  day: 6,  label: "🎂 知达's Birthday" },
  { calendar: 'lunar', month: 1,  day: 15, label: "🎂 彦革's Birthday" },
  { calendar: 'lunar', month: 1,  day: 16, label: "🎂 姥姥's Birthday" },
  // ── Lunar Feb ──────────────────────────────────────────
  { calendar: 'lunar', month: 2,  day: 23, label: "🎂 奶奶's Birthday" },
  // ── Lunar Apr ──────────────────────────────────────────
  { calendar: 'lunar', month: 4,  day: 18, label: "🎂 大弟's Birthday" },
  // ── Lunar May ──────────────────────────────────────────
  { calendar: 'lunar', month: 5,  day: 19, label: "🎂 李平's Birthday" },
  // ── Lunar Jun ──────────────────────────────────────────
  { calendar: 'lunar', month: 6,  day: 21, label: "🎂 露露's Birthday" },
  // ── Lunar Jul ──────────────────────────────────────────
  { calendar: 'lunar', month: 7,  day: 8,  label: "🎂 素云's Birthday" },
  { calendar: 'lunar', month: 7,  day: 11, label: "🎂 李颖's Birthday" },
  // ── Lunar Sep ──────────────────────────────────────────
  { calendar: 'lunar', month: 9,  day: 6,  label: "🎂 姥爷's Birthday" },
  { calendar: 'lunar', month: 9,  day: 7,  label: "🎂 爷爷's Birthday" },
  { calendar: 'lunar', month: 9,  day: 9,  label: "🎂 立霞's Birthday" },
  { calendar: 'lunar', month: 9,  day: 19, label: "🎂 小弟's Birthday" },
  // ── Lunar Oct ──────────────────────────────────────────
  { calendar: 'lunar', month: 10, day: 15, label: "🎂 知语's Birthday" },
  { calendar: 'lunar', month: 10, day: 26, label: "🎂 Feng's Birthday" },
  // ── Lunar Nov ──────────────────────────────────────────
  { calendar: 'lunar', month: 11, day: 3,  label: "🎂 语桐's Birthday" },
  { calendar: 'lunar', month: 11, day: 3,  label: "🎂 小铜号's Birthday" },
  { calendar: 'lunar', month: 11, day: 3,  label: "🎂 知岳's Birthday" },
  { calendar: 'lunar', month: 11, day: 11, label: "🎂 Helen's Birthday" },
  // ── Lunar Dec ──────────────────────────────────────────
  { calendar: 'lunar', month: 12, day: 16, label: "💑 Feng & Helen's Anniversary" },
  { calendar: 'lunar', month: 12, day: 29, label: "🎂 玉霞's Birthday" },
  // ── Gregorian ──────────────────────────────────────────
  { calendar: 'gregorian', month: 12, day: 2, label: "🎂 Tony's Birthday" },
]

/**
 * Returns event labels for the given Gregorian date, or null if none.
 * Supports both lunar and Gregorian calendar entries.
 * Multiple events on the same day are joined with two spaces.
 */
export function getBirthdayLabel(year: number, month: number, day: number): string | null {
  // Compute lunar date once (reused for all lunar entries)
  const lunar = Solar.fromYmd(year, month, day).getLunar()
  const lunarMonth = Math.abs(lunar.getMonth()) // negative = leap month
  const lunarDay = lunar.getDay()

  const matches = ENTRIES.filter(e => {
    if (e.calendar === 'gregorian') return e.month === month && e.day === day
    return e.month === lunarMonth && e.day === lunarDay
  })

  if (matches.length === 0) return null
  return matches.map(e => e.label).join('  ')
}
