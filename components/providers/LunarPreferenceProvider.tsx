'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_LUNAR = 'daybook:showLunar'
const STORAGE_KEY_HOLIDAYS = 'daybook:showHolidays'

type DisplayPreferencesContextValue = {
  showLunar: boolean
  toggleLunar: () => void
  showHolidays: boolean
  toggleHolidays: () => void
}

const LunarPreferenceContext = createContext<DisplayPreferencesContextValue>({
  showLunar: true,
  toggleLunar: () => {},
  showHolidays: true,
  toggleHolidays: () => {},
})

export function LunarPreferenceProvider({ children }: { children: React.ReactNode }) {
  // Initialize true — hydration safe; updated from localStorage after mount
  const [showLunar, setShowLunar] = useState(true)
  const [showHolidays, setShowHolidays] = useState(true)

  useEffect(() => {
    const storedLunar = localStorage.getItem(STORAGE_KEY_LUNAR)
    if (storedLunar !== null) setShowLunar(storedLunar !== 'false')

    const storedHolidays = localStorage.getItem(STORAGE_KEY_HOLIDAYS)
    if (storedHolidays !== null) setShowHolidays(storedHolidays !== 'false')
  }, [])

  const toggleLunar = useCallback(() => {
    setShowLunar((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_LUNAR, String(next))
      return next
    })
  }, [])

  const toggleHolidays = useCallback(() => {
    setShowHolidays((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_HOLIDAYS, String(next))
      return next
    })
  }, [])

  return (
    <LunarPreferenceContext.Provider value={{ showLunar, toggleLunar, showHolidays, toggleHolidays }}>
      {children}
    </LunarPreferenceContext.Provider>
  )
}

export function useLunarPreference() {
  return useContext(LunarPreferenceContext)
}

export function useHolidayPreference() {
  return useContext(LunarPreferenceContext)
}
