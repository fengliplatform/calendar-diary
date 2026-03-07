'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { requireFamily } from '@/lib/auth'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'
import { notifyFamilyMembers } from '@/lib/email/notify'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract Cloudinary public_id from a full URL. */
function extractPublicId(url: string): string {
  // e.g. https://res.cloudinary.com/cloud/image/upload/v123/fam/2026/02/27/uuid.webp
  // public_id = "fam/2026/02/27/uuid" (no extension, no version)
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
  if (!match) throw new Error(`Cannot parse public_id from URL: ${url}`)
  return match[1]
}

/** Convert File (from FormData) to a base64 data URI for Cloudinary upload. */
async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return `data:${file.type};base64,${buffer.toString('base64')}`
}

/** Ensure a DayEntry exists for the given date; return its id. */
async function ensureDayEntry(familyId: string, dateUTC: Date): Promise<string> {
  const entry = await prisma.dayEntry.upsert({
    where: { familyId_date: { familyId, date: dateUTC } },
    update: {},
    create: { familyId, date: dateUTC },
    select: { id: true },
  })
  return entry.id
}

// ---------------------------------------------------------------------------
// Event Text
// ---------------------------------------------------------------------------

export async function upsertEventTextAction(
  date: string,
  text: string,
): Promise<{ error?: string }> {
  const { familyId, userId } = await requireFamily()
  const dateUTC = new Date(`${date}T00:00:00.000Z`)

  try {
    await prisma.dayEntry.upsert({
      where: { familyId_date: { familyId, date: dateUTC } },
      update: { eventText: text || null, updatedBy: userId },
      create: { familyId, date: dateUTC, eventText: text || null, updatedBy: userId },
    })
  } catch {
    return { error: 'Failed to save note. Please try again.' }
  }

  const [ym, d] = [date.slice(0, 7), date.slice(8)]
  revalidatePath(`/calendar/${ym}/${d}`)
  revalidatePath(`/calendar/${ym}`)
  if (text && text.trim().length > 0) {
    notifyFamilyMembers({ actorId: userId, familyId, date, event: 'event_text' })
  }
  return {}
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export async function uploadPhotoAction(
  formData: FormData,
): Promise<{ error?: string; photo?: { id: string; cloudinaryUrl: string; name: string } }> {
  const { familyId, userId } = await requireFamily()

  const file = formData.get('file') as File | null
  const date = formData.get('date') as string | null
  if (!file || !date) return { error: 'Missing file or date.' }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > 10) return { error: 'Photo must be 10 MB or smaller.' }

  const dateUTC = new Date(`${date}T00:00:00.000Z`)
  const [year, month, day] = date.split('-')

  // 1. Upload to Cloudinary
  let cloudinaryUrl: string
  let uploadedPublicId: string
  try {
    const dataUri = await fileToDataUri(file)
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${familyId}/${year}/${month}/${day}`,
      public_id: crypto.randomUUID(),
      transformation: [{ fetch_format: 'webp', quality: 'auto' }],
    })
    cloudinaryUrl = result.secure_url
    uploadedPublicId = result.public_id
  } catch {
    return { error: 'Upload to Cloudinary failed. Please try again.' }
  }

  // 2. Save to DB — if this fails, destroy the orphaned Cloudinary file
  try {
    const dayEntryId = await ensureDayEntry(familyId, dateUTC)
    const photo = await prisma.photo.create({
      data: { dayEntryId, familyId, name: file.name, cloudinaryUrl, uploadedBy: userId },
      select: { id: true, cloudinaryUrl: true, name: true },
    })

    const [ym, d] = [date.slice(0, 7), date.slice(8)]
    revalidatePath(`/calendar/${ym}/${d}`)
    revalidatePath(`/calendar/${ym}`)
    notifyFamilyMembers({ actorId: userId, familyId, date, event: 'photo' })
    return { photo }
  } catch {
    // Clean up orphaned file — best-effort, don't block the error response
    await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'image' }).catch(() => {})
    return { error: 'Failed to save photo record. Please try again.' }
  }
}

export async function deletePhotoAction(
  photoId: string,
): Promise<{ error?: string }> {
  const { familyId } = await requireFamily()

  let photo: { familyId: string; cloudinaryUrl: string; dayEntry: { date: Date } } | null
  try {
    photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { familyId: true, cloudinaryUrl: true, dayEntry: { select: { date: true } } },
    })
  } catch {
    return { error: 'Failed to find photo. Please try again.' }
  }

  if (!photo || photo.familyId !== familyId) return { error: 'Photo not found.' }

  // 1. Delete from Cloudinary first
  let publicId: string
  try {
    publicId = extractPublicId(photo.cloudinaryUrl)
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    if (result.result !== 'ok' && result.result !== 'not found') {
      return { error: 'Failed to delete from storage. Try again.' }
    }
  } catch {
    return { error: 'Failed to delete from storage. Try again.' }
  }

  // 2. Delete from DB only after Cloudinary succeeds
  try {
    await prisma.photo.delete({ where: { id: photoId } })
  } catch {
    return { error: 'Photo removed from storage but database update failed. Refresh to sync.' }
  }

  const dateStr = photo.dayEntry.date.toISOString().slice(0, 10)
  const [ym, d] = [dateStr.slice(0, 7), dateStr.slice(8)]
  revalidatePath(`/calendar/${ym}/${d}`)
  revalidatePath(`/calendar/${ym}`)
  return {}
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export async function uploadVideoAction(
  formData: FormData,
): Promise<{ error?: string; video?: { id: string; cloudinaryUrl: string; thumbnailUrl: string; name: string } }> {
  const { familyId, userId } = await requireFamily()

  const file = formData.get('file') as File | null
  const date = formData.get('date') as string | null
  if (!file || !date) return { error: 'Missing file or date.' }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > 200) return { error: 'Video must be 200 MB or smaller.' }

  const dateUTC = new Date(`${date}T00:00:00.000Z`)
  const [year, month, day] = date.split('-')

  // 1. Upload to Cloudinary
  let cloudinaryUrl: string
  let thumbnailUrl: string
  let uploadedPublicId: string
  try {
    const dataUri = await fileToDataUri(file)
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${familyId}/${year}/${month}/${day}`,
      public_id: crypto.randomUUID(),
      resource_type: 'video',
    })
    cloudinaryUrl = result.secure_url
    uploadedPublicId = result.public_id
    // Auto-generate poster thumbnail at time=0
    thumbnailUrl = cloudinaryUrl
      .replace('/upload/', '/upload/so_0/')
      .replace(/\.\w+$/, '.jpg')
  } catch {
    return { error: 'Upload to Cloudinary failed. Please try again.' }
  }

  // 2. Save to DB — if this fails, destroy the orphaned Cloudinary file
  try {
    const dayEntryId = await ensureDayEntry(familyId, dateUTC)
    const video = await prisma.video.create({
      data: { dayEntryId, familyId, name: file.name, cloudinaryUrl, thumbnailUrl, uploadedBy: userId },
      select: { id: true, cloudinaryUrl: true, thumbnailUrl: true, name: true },
    })

    const [ym, d] = [date.slice(0, 7), date.slice(8)]
    revalidatePath(`/calendar/${ym}/${d}`)
    revalidatePath(`/calendar/${ym}`)
    notifyFamilyMembers({ actorId: userId, familyId, date, event: 'video' })
    return { video: { ...video, thumbnailUrl: video.thumbnailUrl ?? thumbnailUrl } }
  } catch {
    await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'video' }).catch(() => {})
    return { error: 'Failed to save video record. Please try again.' }
  }
}

export async function deleteVideoAction(
  videoId: string,
): Promise<{ error?: string }> {
  const { familyId } = await requireFamily()

  let video: { familyId: string; cloudinaryUrl: string; dayEntry: { date: Date } } | null
  try {
    video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { familyId: true, cloudinaryUrl: true, dayEntry: { select: { date: true } } },
    })
  } catch {
    return { error: 'Failed to find video. Please try again.' }
  }

  if (!video || video.familyId !== familyId) return { error: 'Video not found.' }

  // 1. Delete from Cloudinary first
  try {
    const publicId = extractPublicId(video.cloudinaryUrl)
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
    if (result.result !== 'ok' && result.result !== 'not found') {
      return { error: 'Failed to delete from storage. Try again.' }
    }
  } catch {
    return { error: 'Failed to delete from storage. Try again.' }
  }

  // 2. Delete from DB only after Cloudinary succeeds
  try {
    await prisma.video.delete({ where: { id: videoId } })
  } catch {
    return { error: 'Video removed from storage but database update failed. Refresh to sync.' }
  }

  const dateStr = video.dayEntry.date.toISOString().slice(0, 10)
  const [ym, d] = [dateStr.slice(0, 7), dateStr.slice(8)]
  revalidatePath(`/calendar/${ym}/${d}`)
  revalidatePath(`/calendar/${ym}`)
  return {}
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export async function createJournalAction(date: string): Promise<{ error?: string }> {
  const { familyId, userId } = await requireFamily()
  const dateUTC = new Date(`${date}T00:00:00.000Z`)

  try {
    const dayEntryId = await ensureDayEntry(familyId, dateUTC)

    // Guard: redirect to existing journal rather than creating a duplicate
    const existing = await prisma.journal.findUnique({
      where: { dayEntryId },
      select: { id: true },
    })
    if (existing) {
      redirect(`/journal/${existing.id}/edit`)
    }

    const journal = await prisma.journal.create({
      data: { dayEntryId, familyId, title: '', content: {}, authorId: userId },
      select: { id: true },
    })

    const [ym, d] = [date.slice(0, 7), date.slice(8)]
    revalidatePath(`/calendar/${ym}/${d}`)
    revalidatePath(`/calendar/${ym}`)
    notifyFamilyMembers({ actorId: userId, familyId, date, event: 'journal' })
    redirect(`/journal/${journal.id}/edit`)
  } catch (err) {
    // redirect() throws a special Next.js navigation error — re-throw so navigation works
    if (isRedirectError(err)) throw err
    return { error: 'Failed to create journal. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Day Color
// ---------------------------------------------------------------------------

export async function setDayColorAction(
  date: string,
  colorHex: string,
): Promise<{ error?: string }> {
  const { familyId } = await requireFamily()
  const dateUTC = new Date(`${date}T00:00:00.000Z`)

  try {
    await prisma.dayColorRange.create({
      data: { familyId, startDate: dateUTC, endDate: dateUTC, colorHex },
    })
  } catch {
    return { error: 'Failed to save color. Please try again.' }
  }

  const [ym, d] = [date.slice(0, 7), date.slice(8)]
  revalidatePath(`/calendar/${ym}/${d}`)
  revalidatePath(`/calendar/${ym}`)
  return {}
}

export async function clearDayColorAction(
  date: string,
): Promise<{ error?: string }> {
  const { familyId } = await requireFamily()
  const dateUTC = new Date(`${date}T00:00:00.000Z`)

  try {
    // Delete single-day ranges for this date (startDate=endDate=this day)
    // Multi-day ranges that span this date are not affected
    await prisma.dayColorRange.deleteMany({
      where: { familyId, startDate: dateUTC, endDate: dateUTC },
    })
  } catch {
    return { error: 'Failed to clear color. Please try again.' }
  }

  const [ym, d] = [date.slice(0, 7), date.slice(8)]
  revalidatePath(`/calendar/${ym}/${d}`)
  revalidatePath(`/calendar/${ym}`)
  return {}
}
