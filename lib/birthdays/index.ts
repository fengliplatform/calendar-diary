// Server-only — import only in server components or server actions.
import { Solar } from 'lunar-javascript'

const BIRTHDAYS = [
  { name: 'Helen', lunarMonth: 11, lunarDay: 11 },
]

/**
 * Returns a birthday label for the given Gregorian date, or null if none.
 * Uses Math.abs() on lunar month so leap lunar months are matched correctly.
 */
export function getBirthdayLabel(year: number, month: number, day: number): string | null {
  const lunar = Solar.fromYmd(year, month, day).getLunar()
  const lunarMonth = Math.abs(lunar.getMonth()) // negative = leap month
  const lunarDay = lunar.getDay()

  for (const b of BIRTHDAYS) {
    if (lunarMonth === b.lunarMonth && lunarDay === b.lunarDay) {
      return `🎂 ${b.name}'s Birthday`
    }
  }
  return null
}
