'use client'

import { useTransition } from 'react'
import { Check, Palette, X } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { setDayColorAction, clearDayColorAction } from '@/app/calendar/[yearMonth]/[day]/actions'
import { cn } from '@/lib/utils'

const PRESETS = [
  '#fef08a', // yellow-200
  '#fde68a', // amber-200
  '#fed7aa', // orange-200
  '#fca5a5', // red-300
  '#f9a8d4', // pink-300
  '#d8b4fe', // purple-300
  '#a5b4fc', // indigo-300
  '#93c5fd', // blue-300
  '#6ee7b7', // emerald-300
  '#86efac', // green-300
  '#d9f99d', // lime-200
  '#e5e7eb', // gray-200
]

type Props = {
  date: string // YYYY-MM-DD
  colorHex: string | null
  onColorChange: (color: string | null) => void
}

export function ColorPickerButton({ date, colorHex, onColorChange }: Props) {
  const [, startTransition] = useTransition()

  function handleSelect(hex: string) {
    if (hex === colorHex) return // no-op if same color

    const previous = colorHex
    onColorChange(hex) // optimistic

    startTransition(async () => {
      const res = await setDayColorAction(date, hex)
      if (res.error) {
        onColorChange(previous) // revert
        toast.error(res.error)
      }
    })
  }

  function handleClear() {
    if (!colorHex) return
    const previous = colorHex
    onColorChange(null) // optimistic

    startTransition(async () => {
      const res = await clearDayColorAction(date)
      if (res.error) {
        onColorChange(previous) // revert
        toast.error(res.error)
      }
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Set day color"
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'w-12 h-12 rounded-full shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-200 hover:scale-105 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
            colorHex
              ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-100'
              : 'bg-stone-800 text-white hover:bg-stone-700',
          )}
          style={colorHex ? { backgroundColor: colorHex } : undefined}
        >
          <Palette
            size={20}
            className={colorHex ? 'text-stone-700' : 'text-white'}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={12}
        className="w-48 p-3 shadow-xl border-stone-100"
      >
        <p className="text-xs uppercase tracking-widest text-stone-400 font-medium mb-2.5">
          Day color
        </p>

        {/* Swatches grid */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => handleSelect(hex)}
              aria-label={`Color ${hex}`}
              className={cn(
                'w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-stone-400',
                'flex items-center justify-center',
                colorHex === hex && 'ring-2 ring-stone-600 ring-offset-1',
              )}
              style={{ backgroundColor: hex }}
            >
              {colorHex === hex && <Check size={12} className="text-stone-700" strokeWidth={2.5} />}
            </button>
          ))}
        </div>

        {/* Clear button */}
        {colorHex && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="w-full h-7 gap-1.5 text-xs text-stone-500 hover:text-red-600 hover:bg-red-50"
          >
            <X size={12} />
            Clear color
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
