'use client'

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { JSONContent } from '@tiptap/react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TiptapEditor } from './TiptapEditor'
import { AutosaveIndicator } from './AutosaveIndicator'
import { saveJournalAction } from '@/app/journal/[id]/actions'

type SaveStatus = 'idle' | 'saving' | 'saved'

interface JournalEditorClientProps {
  journalId: string
  initialTitle: string
  initialContent: JSONContent
  backUrl: string
}

export function JournalEditorClient({
  journalId,
  initialTitle,
  initialContent,
  backUrl,
}: JournalEditorClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // useRef for timer — never useState (per CLAUDE.md, avoids re-renders)
  const saveTimer = useRef<NodeJS.Timeout>()
  // Track latest values for flush-on-unmount without stale closure issues
  const latestTitle = useRef(initialTitle)
  const latestContent = useRef<JSONContent>(initialContent)

  const triggerSave = useCallback(
    (newTitle: string, newContent: JSONContent) => {
      clearTimeout(saveTimer.current)
      setSaveStatus('idle')
      saveTimer.current = setTimeout(async () => {
        setSaveStatus('saving')
        const result = await saveJournalAction(journalId, newTitle, newContent)
        if (result?.error) {
          setSaveStatus('idle')
          toast.error(result.error, {
            action: {
              label: 'Retry',
              onClick: () => triggerSave(latestTitle.current, latestContent.current),
            },
          })
        } else {
          setSaveStatus('saved')
          // Return to idle after 2s
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      }, 2000)
    },
    [journalId],
  )

  // Flush pending save on unmount — fire-and-forget (cannot await in cleanup)
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current)
      saveJournalAction(journalId, latestTitle.current, latestContent.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value
    setTitle(newTitle)
    latestTitle.current = newTitle
    triggerSave(newTitle, latestContent.current)
  }

  function handleContentUpdate(json: JSONContent) {
    latestContent.current = json
    triggerSave(latestTitle.current, json)
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in-0 duration-300">
      {/* Top bar */}
      <div className="sticky top-14 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <AutosaveIndicator status={saveStatus} />
      </div>

      {/* Editor area — max-width for comfortable reading */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Title input — H1 sized, no border, no background */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Title"
          className="mb-6 w-full bg-transparent text-4xl font-bold leading-tight outline-none placeholder:text-muted-foreground/50"
        />

        {/* Tiptap editor with toolbar */}
        <TiptapEditor
          content={initialContent}
          journalId={journalId}
          onUpdate={handleContentUpdate}
        />
      </div>
    </div>
  )
}
