'use client'

import React, { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LunarDisplayMode } from '@/lib/lunar'
import { useLunarPreference } from '@/components/providers/LunarPreferenceProvider'

export type DayCellProps = {
  day: number
  dateKey: string // YYYY-MM-DD
  eventText: string | null
  photoCount: number
  videoCount: number
  journal: { id: string; title: string } | null
  colorHex: string | null
  lunarLabel: string | null
  lunarMode: LunarDisplayMode | null
}

export const DayCell = memo(function DayCell({
  day,
  dateKey,
  eventText,
  photoCount,
  videoCount,
  journal,
  colorHex,
  lunarLabel,
  lunarMode,
}: DayCellProps) {
  const router = useRouter()
  const { showLunar } = useLunarPreference()

  // Compute today in user's local timezone client-side.
  // useState(false) avoids SSR/hydration mismatch; useEffect sets correct local date after mount.
  const [isToday, setIsToday] = useState(false)
  useEffect(() => {
    const now = new Date()
    const localKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setIsToday(dateKey === localKey)
  }, [dateKey])

  // dateKey is "YYYY-MM-DD"; route expects two segments: /calendar/YYYY-MM/DD
  function toDayUrl(key: string) {
    const ym = key.slice(0, 7) // "YYYY-MM"
    const d = key.slice(8)     // "DD"
    return `/calendar/${ym}/${d}`
  }

  function handleCellClick() {
    router.push(toDayUrl(dateKey))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(toDayUrl(dateKey))
    }
  }

  const isEmpty = !eventText && photoCount === 0 && videoCount === 0 && !journal

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${dateKey}${isToday ? ', today' : ''}`}
      onClick={handleCellClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative border-r border-b border-stone-100 bg-white',
        'h-16 md:h-28',
        'p-1.5 md:p-2',
        'flex flex-col gap-0.5 md:gap-1',
        'cursor-pointer select-none',
        'transition-all duration-150',
        'hover:shadow-sm',
        !isToday && 'hover:bg-stone-50',
        isEmpty && !isToday && 'hover:shadow-inner',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset',
        isToday && 'bg-amber-50 ring-2 ring-amber-600 ring-inset',
      )}
      style={colorHex && !isToday ? { backgroundColor: colorHex } : undefined}
    >
      {/* Day number */}
      <span
        className={cn(
          'text-xs md:text-sm font-medium leading-none shrink-0',
          isToday ? 'text-amber-700 font-semibold' : 'text-stone-600',
        )}
      >
        {day}
      </span>

      {/* Lunar date label */}
      {showLunar && lunarLabel ? (
        <span
          className={cn(
            'text-[9px] leading-none shrink-0 select-none',
            lunarMode === 'jieqi'
              ? 'text-emerald-600 font-medium'
              : lunarMode === 'newMonth'
              ? 'text-rose-500 font-medium'
              : 'text-stone-400',
          )}
        >
          {lunarLabel}
        </span>
      ) : null}

      {/* Event text — desktop only */}
      {eventText ? (
        <p className="hidden md:block text-xs text-stone-500 truncate leading-tight">
          {eventText}
        </p>
      ) : null}

      {/* Badges */}
      {photoCount > 0 || videoCount > 0 ? (
        <div className="flex items-center gap-1 flex-wrap mt-auto md:mt-0">
          {photoCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-stone-500 bg-stone-100 rounded-full px-1.5 py-0.5 leading-none">
              📷 {photoCount}
            </span>
          ) : null}
          {videoCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-stone-500 bg-stone-100 rounded-full px-1.5 py-0.5 leading-none">
              🎬
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Journal link — desktop only, stops cell navigation */}
      {journal ? (
        <Link
          href={`/journal/${journal.id}`}
          onClick={(e) => e.stopPropagation()}
          title={journal.title}
          className="hidden md:block text-xs italic text-stone-500 underline underline-offset-2 truncate mt-auto hover:text-stone-700 transition-colors"
        >
          {journal.title}
        </Link>
      ) : null}

      {/* Empty cell: subtle dashed border (desktop only) */}
      {isEmpty && !isToday && (
        <div
          className="absolute inset-[3px] hidden md:block rounded-sm border border-dashed border-stone-200 pointer-events-none"
          aria-hidden
        />
      )}

      {/* Empty cell hint — desktop hover only */}
      {isEmpty && !isToday && (
        <span className="hidden md:group-hover:block text-xs text-stone-300 italic mt-auto leading-tight">
          Tap to add a note
        </span>
      )}
    </div>
  )
})
