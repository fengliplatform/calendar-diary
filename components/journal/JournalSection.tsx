'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Edit3, Loader2, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createJournalAction } from '@/app/calendar/[yearMonth]/[day]/actions'

type JournalRef = { id: string; title: string }

type Props = {
  date: string // YYYY-MM-DD
  journal: JournalRef | null
  authorName?: string
}

export function JournalSection({ date, journal, authorName }: Props) {
  const router = useRouter()
  const [isCreating, startCreate] = useTransition()

  function handleCreate() {
    startCreate(async () => {
      const res = await createJournalAction(date)
      // createJournalAction redirects on success; if it returns, there was an error
      if (res?.error) {
        toast.error(res.error)
      }
    })
  }

  return (
    <Card className="shadow-sm border-stone-100">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-xs uppercase tracking-widest text-stone-400 font-medium">
          Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {journal ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen size={16} className="text-stone-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-stone-700 truncate font-medium">
                  {journal.title || <span className="italic text-stone-400">Untitled</span>}
                </p>
                {authorName && (
                  <p className="text-xs text-stone-400">by {authorName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-stone-500 hover:text-stone-800"
                onClick={() => router.push(`/journal/${journal.id}`)}
              >
                <BookOpen size={13} />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => router.push(`/journal/${journal.id}/edit`)}
              >
                <Edit3 size={13} />
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full border-2 border-dashed border-stone-200 rounded-lg py-10 flex flex-col items-center gap-2 text-stone-400 hover:border-stone-300 hover:text-stone-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm">Creating journal…</span>
              </>
            ) : (
              <>
                <PenLine size={22} />
                <span className="text-sm">Start a journal entry for this day</span>
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
