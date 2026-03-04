type SaveStatus = 'idle' | 'saving' | 'saved'

interface AutosaveIndicatorProps {
  status: SaveStatus
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  if (status === 'idle') return null

  return (
    <span className="text-sm text-muted-foreground select-none">
      {status === 'saving' ? 'Saving...' : 'Saved ✓'}
    </span>
  )
}
