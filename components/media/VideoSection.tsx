'use client'

import { memo, useRef, useState, useTransition } from 'react'
import { Loader2, Play, Trash2, Upload, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { uploadVideoAction, deleteVideoAction } from '@/app/calendar/[yearMonth]/[day]/actions'
import { cn } from '@/lib/utils'

export type VideoItem = {
  id: string
  cloudinaryUrl: string
  thumbnailUrl: string
  name: string
  uploading?: boolean
}

type Props = {
  date: string // YYYY-MM-DD
  videos: VideoItem[]
  onAdd: (video: VideoItem) => void
  onRemove: (id: string) => void
  onReplace: (tempId: string, real: VideoItem) => void
}

// ---------------------------------------------------------------------------
// Delete confirm dialog
// ---------------------------------------------------------------------------
type DeleteDialogProps = {
  open: boolean
  videoName: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteDialog({ open, videoName, isPending, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-stone-800">Delete video?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-500">
          &ldquo;{videoName}&rdquo; will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Single video row
// ---------------------------------------------------------------------------
const VideoRow = memo(function VideoRow({
  video,
  onPlay,
  onDelete,
}: {
  video: VideoItem
  onPlay: () => void
  onDelete: () => void
}) {
  if (video.uploading) {
    return (
      <div className="flex items-center gap-3 py-3 px-1 animate-pulse">
        <div className="w-16 h-10 rounded bg-stone-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-2/3 rounded bg-stone-200" />
          <div className="h-2 w-1/3 rounded bg-stone-200" />
        </div>
        <Loader2 size={16} className="text-stone-400 animate-spin shrink-0" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 py-2.5 px-1 rounded-lg',
        'cursor-pointer hover:bg-stone-50 transition-colors',
      )}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPlay()}
      aria-label={`Play ${video.name}`}
    >
      {/* Poster thumbnail */}
      <div className="relative w-16 h-10 rounded overflow-hidden bg-stone-200 shrink-0">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={16} className="text-stone-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
          <Play size={12} className="text-white fill-white" />
        </div>
      </div>

      {/* Name */}
      <p className="flex-1 text-sm text-stone-700 truncate group-hover:text-stone-900 transition-colors">
        {video.name}
      </p>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        aria-label="Delete video"
        className="p-1.5 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------
export function VideoSection({ date, videos, onAdd, onRemove, onReplace }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [playVideo, setPlayVideo] = useState<VideoItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null)
  const [isDeleting, startDelete] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 200) {
      toast.error('Video must be 200 MB or smaller.')
      e.target.value = ''
      return
    }

    const tempId = `temp-${Date.now()}`
    onAdd({ id: tempId, cloudinaryUrl: '', thumbnailUrl: '', name: file.name, uploading: true })

    const fd = new FormData()
    fd.append('file', file)
    fd.append('date', date)

    uploadVideoAction(fd)
      .then((res) => {
        if (res.error || !res.video) {
          onRemove(tempId)
          toast.error(res.error ?? 'Upload failed. Please try again.')
        } else {
          onReplace(tempId, res.video)
          toast.success('Video uploaded.')
        }
      })
      .catch(() => {
        onRemove(tempId)
        toast.error('Upload failed. Please try again.')
      })

    e.target.value = ''
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const snapshot = deleteTarget // capture full object for potential revert
    onRemove(snapshot.id) // optimistic
    setDeleteTarget(null)

    startDelete(async () => {
      const res = await deleteVideoAction(snapshot.id)
      if (res.error) {
        onAdd(snapshot) // revert optimistic removal
        toast.error(res.error)
      } else {
        toast.success(`"${snapshot.name}" deleted.`)
      }
    })
  }

  return (
    <>
      <Card className="shadow-sm border-stone-100">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-widest text-stone-400 font-medium">
              Videos{videos.length > 0 && ` · ${videos.filter((v) => !v.uploading).length}`}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-stone-500 hover:text-stone-800"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={13} />
              Add video
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {videos.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-200 rounded-lg py-10 flex flex-col items-center gap-2 text-stone-400 hover:border-stone-300 hover:text-stone-500 transition-colors"
            >
              <Video size={22} />
              <span className="text-sm">Upload videos from this day</span>
            </button>
          ) : (
            <div className="divide-y divide-stone-100">
              {videos.map((video) => (
                <VideoRow
                  key={video.id}
                  video={video}
                  onPlay={() => !video.uploading && setPlayVideo(video)}
                  onDelete={() => !video.uploading && setDeleteTarget(video)}
                />
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden
          />
        </CardContent>
      </Card>

      {/* Video player modal */}
      <Dialog open={!!playVideo} onOpenChange={(v) => !v && setPlayVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{playVideo?.name}</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setPlayVideo(null)}
            className="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          {playVideo && (
            <video
              src={playVideo.cloudinaryUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh]"
              playsInline
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <DeleteDialog
        open={!!deleteTarget}
        videoName={deleteTarget?.name ?? ''}
        isPending={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
