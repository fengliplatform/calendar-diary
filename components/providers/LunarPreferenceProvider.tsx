'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'daybook:showLunar'

type LunarPreferenceContextValue = {
  showLunar: boolean
  toggleLunar: () => void
}

const LunarPreferenceContext = createContext<LunarPreferenceContextValue>({
  showLunar: true,
  toggleLunar: () => {},
})

export function LunarPreferenceProvider({ children }: { children: React.ReactNode }) {
  // Initialize true (show lunar) — hydration safe; updated from localStorage after mount
  const [showLunar, setShowLunar] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setShowLunar(stored !== 'false')
  }, [])

  const toggleLunar = useCallback(() => {
    setShowLunar((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return (
    <LunarPreferenceContext.Provider value={{ showLunar, toggleLunar }}>
      {children}
    </LunarPreferenceContext.Provider>
  )
}

export function useLunarPreference() {
  return useContext(LunarPreferenceContext)
}
