'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { upsertEventTextAction } from '@/app/calendar/[yearMonth]/[day]/actions'

const MAX_CHARS = 500

type Props = {
  date: string // YYYY-MM-DD
  initialText: string | null
  onSave: (text: string | null) => void
}

export function EventTextSection({ date, initialText, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(initialText ?? '')
  const [savedText, setSavedText] = useState(initialText ?? '')
  const [, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cancelRef = useRef(false)

  function handleClick() {
    setEditing(true)
    // autoFocus on the textarea handles focus when editing mounts
  }

  function handleBlur() {
    // If blur was triggered by Escape key, skip save (text already reverted)
    if (cancelRef.current) {
      cancelRef.current = false
      return
    }
    setEditing(false)
    const trimmed = text.trim()

    // No change — skip server round-trip
    if (trimmed === (savedText ?? '').trim()) return

    const optimistic = trimmed || null
    setSavedText(trimmed)
    onSave(optimistic)

    startTransition(async () => {
      const res = await upsertEventTextAction(date, trimmed)
      if (res.error) {
        // Revert optimistic update
        setSavedText(savedText)
        setText(savedText)
        onSave(savedText || null)
        toast.error(res.error)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      // Cancel — revert to saved, signal handleBlur to skip save
      cancelRef.current = true
      setText(savedText)
      setEditing(false)
      textareaRef.current?.blur()
    }
  }

  const charCount = text.length
  const overLimit = charCount > MAX_CHARS

  return (
    <Card className="shadow-sm border-stone-100">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-xs uppercase tracking-widest text-stone-400 font-medium">
          Note
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              rows={4}
              maxLength={MAX_CHARS + 50} // soft limit; hard cap via validation
              placeholder="What happened today?"
              className="w-full resize-none rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-400 italic">
                Click away to save · Escape to cancel
              </p>
              <span
                className={`text-xs tabular-nums ${overLimit ? 'text-red-500 font-medium' : 'text-stone-400'}`}
              >
                {charCount} / {MAX_CHARS}
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className="w-full text-left group"
            aria-label={savedText ? 'Edit note' : 'Add a note for this day'}
          >
            {savedText ? (
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap group-hover:text-stone-900 transition-colors">
                {savedText}
              </p>
            ) : (
              <p className="text-sm text-stone-400 italic group-hover:text-stone-500 transition-colors">
                Add a note for this day...
              </p>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
