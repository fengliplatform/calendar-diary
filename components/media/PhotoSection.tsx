'use client'

import { memo, useRef, useState, useTransition } from 'react'
import { Loader2, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { uploadPhotoAction, deletePhotoAction } from '@/app/calendar/[yearMonth]/[day]/actions'
import { cn } from '@/lib/utils'

export type PhotoItem = {
  id: string
  cloudinaryUrl: string
  name: string
  uploading?: boolean
}

type Props = {
  date: string // YYYY-MM-DD
  photos: PhotoItem[]
  onAdd: (photo: PhotoItem) => void
  onRemove: (id: string) => void
  onReplace: (tempId: string, real: PhotoItem) => void
}

function getThumbnailUrl(url: string): string {
  return url.replace('/upload/', '/upload/w_400,h_400,c_fill,g_auto/')
}

function getFullUrl(url: string): string {
  return url.replace('/upload/', '/upload/w_1920,q_auto/')
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------
type DeleteDialogProps = {
  open: boolean
  photoName: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteDialog({ open, photoName, isPending, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-stone-800">Delete photo?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-500">
          &ldquo;{photoName}&rdquo; will be permanently removed. This cannot be undone.
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
// Single thumbnail cell
// ---------------------------------------------------------------------------
type ThumbProps = {
  photo: PhotoItem
  onView: () => void
  onDelete: () => void
}

const PhotoThumb = memo(function PhotoThumb({ photo, onView, onDelete }: ThumbProps) {
  if (photo.uploading) {
    return (
      <div className="aspect-square rounded-lg bg-stone-100 flex items-center justify-center animate-pulse">
        <Loader2 size={22} className="text-stone-400 animate-spin" />
      </div>
    )
  }

  return (
    // Entire tile is clickable to view — spec: "Click thumbnail → opens full-size modal"
    <button
      type="button"
      onClick={onView}
      aria-label={`View ${photo.name}`}
      className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getThumbnailUrl(photo.cloudinaryUrl)}
        alt={photo.name}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />
      {/* Hover overlay — delete button always accessible */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          aria-label="Delete photo"
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </button>
  )
})

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------
export function PhotoSection({ date, photos, onAdd, onRemove, onReplace }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [viewPhoto, setViewPhoto] = useState<PhotoItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PhotoItem | null>(null)
  const [isDeleting, startDelete] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 10) {
      toast.error('Photo must be 10 MB or smaller.')
      e.target.value = ''
      return
    }

    const tempId = `temp-${Date.now()}`
    onAdd({ id: tempId, cloudinaryUrl: '', name: file.name, uploading: true })

    const fd = new FormData()
    fd.append('file', file)
    fd.append('date', date)

    uploadPhotoAction(fd)
      .then((res) => {
        if (res.error || !res.photo) {
          onRemove(tempId)
          toast.error(res.error ?? 'Upload failed. Please try again.')
        } else {
          onReplace(tempId, res.photo)
          toast.success('Photo uploaded.')
        }
      })
      .catch(() => {
        onRemove(tempId)
        toast.error('Upload failed. Please try again.')
      })

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const snapshot = deleteTarget // capture full object for potential revert
    onRemove(snapshot.id) // optimistic
    setDeleteTarget(null)

    startDelete(async () => {
      const res = await deletePhotoAction(snapshot.id)
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
              Photos{photos.length > 0 && ` · ${photos.filter((p) => !p.uploading).length}`}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-stone-500 hover:text-stone-800"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={13} />
              Add photo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {photos.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-200 rounded-lg py-10 flex flex-col items-center gap-2 text-stone-400 hover:border-stone-300 hover:text-stone-500 transition-colors"
            >
              <Upload size={22} />
              <span className="text-sm">Upload photos from this day</span>
            </button>
          ) : (
            <div className={cn('grid gap-2', 'grid-cols-2 md:grid-cols-3')}>
              {photos.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photo={photo}
                  onView={() => !photo.uploading && setViewPhoto(photo)}
                  onDelete={() => !photo.uploading && setDeleteTarget(photo)}
                />
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden
          />
        </CardContent>
      </Card>

      {/* Full-size viewer */}
      <Dialog open={!!viewPhoto} onOpenChange={(v) => !v && setViewPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{viewPhoto?.name}</DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={() => setViewPhoto(null)}
            className="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          {viewPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getFullUrl(viewPhoto.cloudinaryUrl)}
              alt={viewPhoto.name}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <DeleteDialog
        open={!!deleteTarget}
        photoName={deleteTarget?.name ?? ''}
        isPending={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
