import { redirect } from 'next/navigation'
import type { JSONContent } from '@tiptap/react'
import { requireFamily } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { JournalEditorClient } from '@/components/journal/JournalEditorClient'

interface PageProps {
  params: { id: string }
}

export default async function JournalEditPage({ params }: PageProps) {
  const { familyId } = await requireFamily()

  const journal = await prisma.journal.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      content: true,
      familyId: true,
      dayEntry: { select: { date: true } },
    },
  })

  if (!journal || journal.familyId !== familyId) {
    redirect('/calendar')
  }

  const d = journal.dayEntry.date
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const backUrl = `/calendar/${yyyy}-${mm}/${dd}`

  return (
    <JournalEditorClient
      journalId={journal.id}
      initialTitle={journal.title}
      initialContent={(journal.content ?? {}) as JSONContent}
      backUrl={backUrl}
    />
  )
}
