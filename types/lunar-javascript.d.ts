declare module 'lunar-javascript' {
  class Lunar {
    getDayInChinese(): string
    getMonthInChinese(): string
    getJieQi(): string  // "" if not a solar term day
    getMonth(): number  // negative if leap month
    getDay(): number    // 1 = first day of lunar month
  }

  class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    getLunar(): Lunar
  }
}
