'use client'

import { useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { BookOpen, ChevronLeft, ChevronRight, Search, Menu, Moon, Flag, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useLunarPreference, useHolidayPreference } from '@/components/providers/LunarPreferenceProvider'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function adjacentMonth(year: number, month: number, delta: 1 | -1): string {
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { showLunar, toggleLunar } = useLunarPreference()
  const { showHolidays, toggleHolidays } = useHolidayPreference()

  // Parse calendar month from pathname (matches /calendar/YYYY-MM and /calendar/YYYY-MM/DD)
  const calendarMatch = useMemo(() => {
    const m = /^\/calendar\/(\d{4})-(\d{2})/.exec(pathname)
    if (!m) return null
    const year = parseInt(m[1], 10)
    const month = parseInt(m[2], 10)
    return { year, month }
  }, [pathname])

  // Keyboard navigation: left/right arrows navigate months (month grid only)
  useEffect(() => {
    const isMonthPage = /^\/calendar\/\d{4}-\d{2}$/.test(pathname)
    if (!isMonthPage || !calendarMatch) return

    const { year, month } = calendarMatch

    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'ArrowLeft') router.push(`/calendar/${adjacentMonth(year, month, -1)}`)
      if (e.key === 'ArrowRight') router.push(`/calendar/${adjacentMonth(year, month, 1)}`)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pathname, calendarMatch, router])

  // Logo link: always points to current calendar month
  const currentMonthHref = useMemo(() => {
    const now = new Date()
    return `/calendar/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  // Hide navbar on auth pages — after all hooks
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-stone-50/95 backdrop-blur-sm border-b border-stone-100">
      <nav
        className="mx-auto max-w-5xl h-full px-4 md:px-8 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Left: Logo */}
        <Link
          href={currentMonthHref}
          className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors shrink-0"
          aria-label="Daybook — go to current month"
        >
          <BookOpen size={20} strokeWidth={1.5} />
          <span className="font-light tracking-tight text-base hidden sm:inline">Daybook</span>
        </Link>

        {/* Center: Month navigation (calendar pages only) */}
        {calendarMatch ? (
          <div className="flex items-center gap-1" aria-label="Month navigation">
            <Link
              href={`/calendar/${adjacentMonth(calendarMatch.year, calendarMatch.month, -1)}`}
              aria-label="Previous month"
              className="h-11 w-11 flex items-center justify-center rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="text-center select-none px-1 min-w-[160px]">
              <span className="text-lg font-light text-stone-800 tracking-tight">
                {MONTH_NAMES[calendarMatch.month - 1]}
              </span>{' '}
              <span className="text-base font-light text-stone-400">{calendarMatch.year}</span>
            </div>
            <Link
              href={`/calendar/${adjacentMonth(calendarMatch.year, calendarMatch.month, 1)}`}
              aria-label="Next month"
              className="h-11 w-11 flex items-center justify-center rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <ChevronRight size={20} />
            </Link>
          </div>
        ) : (
          <div />
        )}

        {/* Right: Search + UserButton + Mobile menu */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/search"
            aria-label="Search entries"
            className="h-11 w-11 flex items-center justify-center rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <Search size={20} />
          </Link>

          <button
            onClick={toggleLunar}
            aria-label={showLunar ? 'Hide lunar dates' : 'Show lunar dates'}
            aria-pressed={showLunar}
            className={cn(
              'h-11 w-11 flex items-center justify-center rounded-md transition-colors',
              showLunar
                ? 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100',
            )}
          >
            <Moon size={18} strokeWidth={1.5} />
          </button>

          <button
            onClick={toggleHolidays}
            aria-label={showHolidays ? 'Hide holidays' : 'Show holidays'}
            aria-pressed={showHolidays}
            className={cn(
              'h-11 w-11 flex items-center justify-center rounded-md transition-colors',
              showHolidays
                ? 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
                : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100',
            )}
          >
            <Flag size={18} strokeWidth={1.5} />
          </button>

          <div className="ml-1">
            <UserButton />
          </div>

          {/* Mobile hamburger — settings link */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden ml-1 h-11 w-11 text-stone-500 hover:text-stone-800"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-left font-light tracking-tight">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile menu">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors text-sm"
                >
                  <Settings size={18} />
                  Family Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
