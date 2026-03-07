'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EventTextSection } from '@/components/calendar/EventTextSection'
import { PhotoSection, type PhotoItem } from '@/components/media/PhotoSection'
import { VideoSection, type VideoItem } from '@/components/media/VideoSection'
import { JournalSection } from '@/components/journal/JournalSection'
import { ColorPickerButton } from '@/components/calendar/ColorPickerButton'

type JournalRef = { id: string; title: string }

type Props = {
  date: string          // YYYY-MM-DD
  yearMonth: string     // YYYY-MM — for breadcrumb link
  heading: string       // "Wednesday, February 27"
  breadcrumb: string    // "February 2026"
  initialEventText: string | null
  eventTextUpdatedBy?: string   // resolved display name of last editor
  initialPhotos: PhotoItem[]
  initialVideos: VideoItem[]
  initialJournal: JournalRef | null
  journalAuthorName?: string    // resolved display name of journal author
  initialColorHex: string | null
}

export function DayDetailView({
  date,
  yearMonth,
  heading,
  breadcrumb,
  initialEventText,
  eventTextUpdatedBy,
  initialPhotos,
  initialVideos,
  initialJournal,
  journalAuthorName,
  initialColorHex,
}: Props) {
  const [eventText, setEventText] = useState<string | null>(initialEventText)
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos)
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos)
  const [colorHex, setColorHex] = useState<string | null>(initialColorHex)

  // ---------------------------------------------------------------------------
  // Photo handlers
  // ---------------------------------------------------------------------------
  function addPhoto(photo: PhotoItem) {
    setPhotos((prev) => [...prev, photo])
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function replacePhoto(tempId: string, real: PhotoItem) {
    setPhotos((prev) => prev.map((p) => (p.id === tempId ? real : p)))
  }

  // ---------------------------------------------------------------------------
  // Video handlers
  // ---------------------------------------------------------------------------
  function addVideo(video: VideoItem) {
    setVideos((prev) => [...prev, video])
  }

  function removeVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  function replaceVideo(tempId: string, real: VideoItem) {
    setVideos((prev) => prev.map((v) => (v.id === tempId ? real : v)))
  }

  return (
    <div
      className="min-h-screen bg-stone-50 transition-colors duration-300 animate-in fade-in-0 duration-300"
      style={colorHex ? { backgroundColor: `${colorHex}33` } : undefined}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-14 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-100 px-4 md:px-8 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link
            href={`/calendar/${yearMonth}`}
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 transition-colors shrink-0"
            aria-label={`Back to ${breadcrumb}`}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{breadcrumb}</span>
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="mx-auto max-w-2xl px-4 md:px-8 py-6 pb-24 space-y-4">
        {/* Date heading */}
        <div className="pt-2 pb-1">
          <h1 className="text-2xl md:text-3xl font-light text-stone-800 tracking-tight">
            {heading}
          </h1>
        </div>

        {/* Section 1 — Event note */}
        <EventTextSection
          date={date}
          initialText={eventText}
          onSave={setEventText}
          updatedByName={eventTextUpdatedBy}
        />

        {/* Section 2 — Photos */}
        <PhotoSection
          date={date}
          photos={photos}
          onAdd={addPhoto}
          onRemove={removePhoto}
          onReplace={replacePhoto}
        />

        {/* Section 3 — Videos */}
        <VideoSection
          date={date}
          videos={videos}
          onAdd={addVideo}
          onRemove={removeVideo}
          onReplace={replaceVideo}
        />

        {/* Section 4 — Journal */}
        <JournalSection
          date={date}
          journal={initialJournal}
          authorName={journalAuthorName}
        />
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Floating color picker                                                */}
      {/* ------------------------------------------------------------------ */}
      <ColorPickerButton
        date={date}
        colorHex={colorHex}
        onColorChange={setColorHex}
      />
    </div>
  )
}
