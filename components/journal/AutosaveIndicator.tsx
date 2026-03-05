type SaveStatus = 'idle' | 'saving' | 'saved'

interface AutosaveIndicatorProps {
  status: SaveStatus
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className="text-sm text-muted-foreground select-none min-w-[4rem] text-right"
    >
      {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved ✓' : null}
    </span>
  )
}
