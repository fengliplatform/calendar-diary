// Server-only — import only in server components or server actions.
// Pure TypeScript implementation, no npm package required.

/** Returns the day-of-month for the nth occurrence of a weekday in a given month.
 *  dow: 0=Sun, 1=Mon, …, 6=Sat
 *  n: 1=first, 2=second, 3=third, 4=fourth, -1=last
 */
function getNthWeekday(year: number, month: number, dow: number, n: number): number {
  if (n > 0) {
    // First occurrence of dow in month
    const first = new Date(year, month - 1, 1).getDay()
    const offset = (dow - first + 7) % 7
    return 1 + offset + (n - 1) * 7
  } else {
    // Last occurrence of dow in month
    const daysInMonth = new Date(year, month, 0).getDate()
    const last = new Date(year, month - 1, daysInMonth).getDay()
    const offset = (last - dow + 7) % 7
    return daysInMonth - offset
  }
}

/** Meeus/Jones/Butcher Easter Sunday algorithm. Returns { month, day } in Gregorian calendar. */
function getEaster(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

/** Add days to an Easter date, returning { month, day }. */
function addDaysToEaster(
  easter: { month: number; day: number },
  year: number,
  delta: number,
): { month: number; day: number } {
  const d = new Date(year, easter.month - 1, easter.day + delta)
  return { month: d.getMonth() + 1, day: d.getDate() }
}

/** Format month+day as "MM-DD" key. */
function key(month: number, day: number): string {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Build the US federal holiday map for a given year. */
function usHolidays(year: number): Map<string, string> {
  const h = new Map<string, string>()

  // Fixed-date holidays
  h.set('01-01', "New Year's Day")
  h.set('06-19', 'Juneteenth')
  h.set('07-04', 'Independence Day')
  h.set('11-11', 'Veterans Day')
  h.set('12-25', 'Christmas Day')

  // Calculated holidays
  const mlk = getNthWeekday(year, 1, 1, 3) // 3rd Mon Jan
  h.set(key(1, mlk), 'MLK Day')

  const presidents = getNthWeekday(year, 2, 1, 3) // 3rd Mon Feb
  h.set(key(2, presidents), "Presidents' Day")

  const memorial = getNthWeekday(year, 5, 1, -1) // Last Mon May
  h.set(key(5, memorial), 'Memorial Day')

  const labor = getNthWeekday(year, 9, 1, 1) // 1st Mon Sep
  h.set(key(9, labor), 'Labor Day')

  const columbus = getNthWeekday(year, 10, 1, 2) // 2nd Mon Oct
  h.set(key(10, columbus), 'Columbus Day')

  const thanksgiving = getNthWeekday(year, 11, 4, 4) // 4th Thu Nov
  h.set(key(11, thanksgiving), 'Thanksgiving (US)')

  return h
}

/** Build the Canadian federal holiday map for a given year. */
function caFederalHolidays(year: number): Map<string, string> {
  const h = new Map<string, string>()

  // Fixed-date holidays
  h.set('01-01', "New Year's Day")
  h.set('07-01', 'Canada Day')
  h.set('09-30', 'Truth & Reconciliation Day')
  h.set('11-11', 'Remembrance Day')
  h.set('12-25', 'Christmas Day')
  h.set('12-26', 'Boxing Day')

  // Good Friday: Easter - 2 days
  const easter = getEaster(year)
  const gf = addDaysToEaster(easter, year, -2)
  h.set(key(gf.month, gf.day), 'Good Friday')

  // Victoria Day: last Monday on or before May 24 (strictly before May 25)
  // Formula: find Monday <= May 24 by going back from May 24
  const may24dow = new Date(year, 4, 24).getDay() // 0=Sun
  const victoriaDay = 24 - (may24dow + 6) % 7
  h.set(key(5, victoriaDay), 'Victoria Day')

  // Labour Day: 1st Monday in September
  const labour = getNthWeekday(year, 9, 1, 1)
  h.set(key(9, labour), 'Labour Day')

  // Thanksgiving: 2nd Monday in October
  const thanksgiving = getNthWeekday(year, 10, 1, 2)
  h.set(key(10, thanksgiving), 'Thanksgiving (CA)')

  return h
}

/** Build the Ontario provincial holiday map for a given year (extras beyond federal). */
function ontarioHolidays(year: number): Map<string, string> {
  const h = new Map<string, string>()

  // Family Day: 3rd Monday in February
  const familyDay = getNthWeekday(year, 2, 1, 3)
  h.set(key(2, familyDay), 'Family Day (ON)')

  // Civic Holiday: 1st Monday in August
  const civicHoliday = getNthWeekday(year, 8, 1, 1)
  h.set(key(8, civicHoliday), 'Civic Holiday (ON)')

  return h
}

/**
 * Returns the holiday name for a given date, or null if not a holiday.
 * Covers US federal, Canadian federal, and Ontario provincial holidays.
 * Priority: US federal > Canadian federal > Ontario provincial.
 */
export function getHolidayName(year: number, month: number, day: number): string | null {
  const dateKey = key(month, day)

  const us = usHolidays(year)
  if (us.has(dateKey)) return us.get(dateKey)!

  const ca = caFederalHolidays(year)
  if (ca.has(dateKey)) return ca.get(dateKey)!

  const on = ontarioHolidays(year)
  if (on.has(dateKey)) return on.get(dateKey)!

  return null
}
