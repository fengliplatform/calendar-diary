// Server-only — import only in server components or server actions.
import { Solar } from 'lunar-javascript'

const BIRTHDAYS = [
  // Lunar Jan
  { name: '立芝',   lunarMonth: 1,  lunarDay: 1  },
  { name: '知达',   lunarMonth: 1,  lunarDay: 6  },
  { name: '彦革',   lunarMonth: 1,  lunarDay: 15 },
  { name: '姥姥',   lunarMonth: 1,  lunarDay: 16 },
  // Lunar Feb
  { name: '奶奶',   lunarMonth: 2,  lunarDay: 23 },
  // Lunar Apr
  { name: '大弟',   lunarMonth: 4,  lunarDay: 18 },
  // Lunar May
  { name: '李平',   lunarMonth: 5,  lunarDay: 19 },
  // Lunar Jun
  { name: '露露',   lunarMonth: 6,  lunarDay: 21 },
  // Lunar Jul
  { name: '素云',   lunarMonth: 7,  lunarDay: 8  },
  { name: '李颖',   lunarMonth: 7,  lunarDay: 11 },
  // Lunar Sep
  { name: '姥爷',   lunarMonth: 9,  lunarDay: 6  },
  { name: '爷爷',   lunarMonth: 9,  lunarDay: 7  },
  { name: '立霞',   lunarMonth: 9,  lunarDay: 9  },
  { name: '小弟',   lunarMonth: 9,  lunarDay: 19 },
  // Lunar Oct
  { name: '知语',   lunarMonth: 10, lunarDay: 15 },
  { name: 'Feng',   lunarMonth: 10, lunarDay: 26 },
  // Lunar Nov
  { name: '语桐',   lunarMonth: 11, lunarDay: 3  },
  { name: '小铜号', lunarMonth: 11, lunarDay: 3  },
  { name: '知岳',   lunarMonth: 11, lunarDay: 3  },
  { name: 'Helen',  lunarMonth: 11, lunarDay: 11 },
  // Lunar Dec
  { name: '玉霞',   lunarMonth: 12, lunarDay: 29 },
]

/**
 * Returns a birthday label for the given Gregorian date, or null if none.
 * Uses Math.abs() on lunar month so leap lunar months are matched correctly.
 * Multiple birthdays on the same lunar date are joined with " · ".
 */
export function getBirthdayLabel(year: number, month: number, day: number): string | null {
  const lunar = Solar.fromYmd(year, month, day).getLunar()
  const lunarMonth = Math.abs(lunar.getMonth()) // negative = leap month
  const lunarDay = lunar.getDay()

  const matches = BIRTHDAYS.filter(
    b => b.lunarMonth === lunarMonth && b.lunarDay === lunarDay
  )
  if (matches.length === 0) return null
  return `🎂 ${matches.map(b => b.name).join(' · ')}`
}
