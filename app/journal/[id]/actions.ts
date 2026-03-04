'use server'

import { revalidatePath } from 'next/cache'
import type { JSONContent } from '@tiptap/react'
import { requireFamily } from '@/lib/auth'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert File (from FormData) to a base64 data URI for Cloudinary upload. */
async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return `data:${file.type};base64,${buffer.toString('base64')}`
}

/** Format a UTC Date to '/calendar/YYYY-MM/DD' back-link path. */
function formatBackUrl(date: Date): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `/calendar/${yyyy}-${mm}/${dd}`
}

// ---------------------------------------------------------------------------
// Save Journal
// ---------------------------------------------------------------------------

export async function saveJournalAction(
  journalId: string,
  title: string,
  content: JSONContent,
): Promise<{ error?: string }> {
  const { familyId } = await requireFamily()

  let journal: { familyId: string; dayEntry: { date: Date } } | null
  try {
    journal = await prisma.journal.findUnique({
      where: { id: journalId },
      select: { familyId: true, dayEntry: { select: { date: true } } },
    })
  } catch {
    return { error: 'Failed to find journal. Please try again.' }
  }

  if (!journal || journal.familyId !== familyId) {
    return { error: 'Journal not found.' }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.journal.update({
      where: { id: journalId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { title, content: content as any },
    })
  } catch {
    return { error: 'Failed to save journal. Please try again.' }
  }

  // Revalidate both the read-only view and the owning day detail page
  revalidatePath(`/journal/${journalId}`)
  const backUrl = formatBackUrl(journal.dayEntry.date)
  revalidatePath(backUrl)
  // Also revalidate the month view so journal title badge updates
  const ym = backUrl.split('/')[2] // 'YYYY-MM'
  revalidatePath(`/calendar/${ym}`)

  return {}
}

// ---------------------------------------------------------------------------
// Upload Journal Image
// ---------------------------------------------------------------------------

export async function uploadJournalImageAction(
  formData: FormData,
): Promise<{ error?: string; url?: string }> {
  const { familyId } = await requireFamily()

  const file = formData.get('file') as File | null
  const journalId = formData.get('journalId') as string | null
  if (!file || !journalId) return { error: 'Missing file or journal ID.' }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > 10) return { error: 'Image must be 10 MB or smaller.' }

  // Verify the journal belongs to this family and get the date for folder structure
  let journal: { familyId: string; dayEntry: { date: Date } } | null
  try {
    journal = await prisma.journal.findUnique({
      where: { id: journalId },
      select: { familyId: true, dayEntry: { select: { date: true } } },
    })
  } catch {
    return { error: 'Image upload failed. Please try again.' }
  }

  if (!journal || journal.familyId !== familyId) {
    return { error: 'Journal not found.' }
  }

  // Use the canonical folder structure: /{familyId}/{YYYY}/{MM}/{DD}/
  const d = journal.dayEntry.date
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')

  try {
    const dataUri = await fileToDataUri(file)
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${familyId}/${year}/${month}/${day}`,
      public_id: crypto.randomUUID(),
      transformation: [{ fetch_format: 'webp', quality: 'auto' }],
    })
    return { url: result.secure_url }
  } catch {
    return { error: 'Image upload failed. Please try again.' }
  }
}
