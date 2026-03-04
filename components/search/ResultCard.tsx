'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const FIELD_LABELS: Record<string, string> = {
  eventText: 'Event note',
  journalTitle: 'Journal title',
  journalContent: 'Journal content',
  photoNames: 'Photo name',
  videoNames: 'Video name',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  // Use local date constructor to avoid UTC-offset day shift
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <strong key={i} className="font-semibold text-stone-900">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

function truncate(text: string, max = 140): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

interface ResultCardProps {
  date: string // YYYY-MM-DD
  matchedField: string
  snippet: string
  query: string
}

export default function ResultCard({ date, matchedField, snippet, query }: ResultCardProps) {
  const router = useRouter()

  function handleClick() {
    const parts = date.split('-') // ["2026", "02", "27"]
    const ym = `${parts[0]}-${parts[1]}`
    const dd = parts[2]
    router.push(`/calendar/${ym}/${dd}`)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      className="w-full h-auto flex flex-col items-start justify-start gap-0 text-left border border-stone-200 rounded-lg p-4 whitespace-normal hover:bg-stone-50 hover:text-inherit hover:border-stone-300 focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <p className="font-medium text-stone-800">{formatDate(date)}</p>
      <p className="text-xs text-stone-400 mt-0.5 mb-2">
        {FIELD_LABELS[matchedField] ?? matchedField}
      </p>
      <p className="text-sm text-stone-600 leading-relaxed">
        {highlight(truncate(snippet), query)}
      </p>
    </Button>
  )
}
