// Server-only — import only in server components or server actions, never in client components.
import { Solar } from 'lunar-javascript'

export type LunarDisplayMode = 'jieqi' | 'newMonth' | 'day'

export interface LunarInfo {
  label: string
  mode: LunarDisplayMode
}

/**
 * Returns the highest-priority lunar label for a given Gregorian date.
 * Priority: solar term (jieqi) > first day of lunar month > regular lunar day.
 */
export function getLunarInfo(year: number, month: number, day: number): LunarInfo {
  const lunar = Solar.fromYmd(year, month, day).getLunar()

  const jieqi = lunar.getJieQi()
  if (jieqi) return { label: jieqi, mode: 'jieqi' }

  if (lunar.getDay() === 1) {
    const prefix = lunar.getMonth() < 0 ? '闰' : ''
    return { label: `${prefix}${lunar.getMonthInChinese()}月`, mode: 'newMonth' }
  }

  return { label: lunar.getDayInChinese(), mode: 'day' }
}
