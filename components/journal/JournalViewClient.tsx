'use client'

import { useMemo } from 'react'
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JournalViewClientProps {
  journal: {
    id: string
    title: string
    content: JSONContent
  }
  backUrl: string
}

export function JournalViewClient({ journal, backUrl }: JournalViewClientProps) {
  const router = useRouter()

  // Memoize to prevent unnecessary extension re-creation
  const extensions = useMemo(
    () => [
      StarterKit,
      Image,
      Link.configure({ openOnClick: true }),
      Typography,
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content: journal.content,
    editable: false,
    immediatelyRender: false, // ⚠️ REQUIRED — prevents Next.js SSR hydration error
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none p-4',
      },
    },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/journal/${journal.id}/edit`)}
          className="gap-1.5"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Content area — max-width for comfortable reading */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {journal.title && (
          <h1 className="mb-6 text-4xl font-bold leading-tight">{journal.title}</h1>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
