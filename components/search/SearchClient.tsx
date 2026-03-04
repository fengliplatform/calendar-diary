'use client'

import { useRef, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Fuse from 'fuse.js'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ResultCard from './ResultCard'
import type { FtsResult, FuzzyItem } from '@/lib/search/postgres'

interface MergedResult {
  date: string
  matchedField: string
  snippet: string
  score: number
}

interface SearchClientProps {
  query: string
  from: string
  to: string
  ftsResults: FtsResult[]
  fuzzyData: FuzzyItem[]
}

export default function SearchClient({
  query,
  from,
  to,
  ftsResults,
  fuzzyData,
}: SearchClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // rerender-use-ref-transient-values: refs for reading input values on submit
  const inputRef = useRef<HTMLInputElement>(null)
  const fromRef = useRef<HTMLInputElement>(null)
  const toRef = useRef<HTMLInputElement>(null)

  function submit() {
    const q = inputRef.current?.value.trim() ?? ''
    const f = fromRef.current?.value ?? from
    const t = toRef.current?.value ?? to
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('from', f)
    params.set('to', t)
    // rerender-transitions: use startTransition for non-urgent URL navigation
    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  // Fuse.js runs client-side only (bundle stays out of server bundle)
  const fuseResults = useMemo(() => {
    if (!query) return []
    const fuse = new Fuse(fuzzyData, {
      keys: ['title', 'photoNames', 'videoNames'],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true, // required to accurately report which field matched
    })
    return fuse.search(query)
  }, [query, fuzzyData])

  // Merge FTS + Fuse results, deduplicate by date (js-index-maps)
  const results = useMemo<MergedResult[]>(() => {
    const map = new Map<string, MergedResult>()

    for (const r of ftsResults) {
      const snippet =
        r.matchedField === 'eventText'
          ? (r.eventText ?? '')
          : (r.journalTitle ?? '')
      map.set(r.date, {
        date: r.date,
        matchedField: r.matchedField,
        snippet,
        score: r.rank,
      })
    }

    for (const { item, score, matches } of fuseResults) {
      // Use Fuse match info for accurate field identification (not string.includes)
      const firstMatch = matches?.[0]
      const matchedKey = firstMatch?.key ?? 'title'

      let matchedField: string
      let snippet: string

      if (matchedKey === 'photoNames') {
        matchedField = 'photoNames'
        snippet = firstMatch?.value ?? item.photoNames[0] ?? ''
      } else if (matchedKey === 'videoNames') {
        matchedField = 'videoNames'
        snippet = firstMatch?.value ?? item.videoNames[0] ?? ''
      } else {
        matchedField = 'journalTitle'
        snippet = item.title
      }

      const fuseScore = 1 - (score ?? 1) // invert: higher = better match
      const existing = map.get(item.date)
      map.set(item.date, {
        date: item.date,
        matchedField: existing?.matchedField ?? matchedField,
        snippet: existing?.snippet ?? snippet,
        score: (existing?.score ?? 0) + fuseScore,
      })
    }

    return Array.from(map.values()).sort((a, b) => b.score - a.score)
  }, [ftsResults, fuseResults, query])

  const hasQuery = query.length > 0
  const hasResults = results.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Search</h1>

      {/* Search bar */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            defaultValue={query}
            autoFocus
            placeholder="Search memories…"
            onKeyDown={handleKeyDown}
            className="pr-24 h-10 focus-visible:ring-amber-500"
          />
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-800 hover:bg-stone-700 text-white"
          >
            {isPending ? 'Searching…' : 'Search'}
          </Button>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label
              htmlFor="search-from"
              className="text-xs text-stone-500 whitespace-nowrap"
            >
              From
            </label>
            <Input
              ref={fromRef}
              id="search-from"
              type="date"
              defaultValue={from}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label
              htmlFor="search-to"
              className="text-xs text-stone-500 whitespace-nowrap"
            >
              To
            </label>
            <Input
              ref={toRef}
              id="search-to"
              type="date"
              defaultValue={to}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Results area */}
      {/* rendering-usetransition-loading: overlay skeleton during isPending */}
      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="border border-stone-100 rounded-lg p-4 space-y-2 animate-pulse"
            >
              <div className="h-4 w-40 bg-stone-100 rounded" />
              <div className="h-3 w-24 bg-stone-100 rounded" />
              <div className="h-4 w-full bg-stone-100 rounded" />
              <div className="h-4 w-3/4 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : !hasQuery ? (
        <div className="text-center py-16">
          <p className="text-sm text-stone-400">Search your family memories</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-16">
          <svg
            className="mx-auto mb-4 text-stone-300"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M8 11h6M11 8v6" opacity="0.4" />
          </svg>
          <p className="text-lg font-medium text-stone-600">No entries found</p>
          <p className="text-sm text-stone-400 mt-1">
            Try different keywords or expand the date range
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-stone-400 mb-1">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map(r => (
            <ResultCard
              key={r.date}
              date={r.date}
              matchedField={r.matchedField}
              snippet={r.snippet}
              query={query}
            />
          ))}
        </div>
      )}
    </div>
  )
}
