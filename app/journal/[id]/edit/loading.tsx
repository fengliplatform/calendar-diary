export default function JournalEditLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Top bar skeleton */}
      <div className="sticky top-14 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-2">
        <div className="h-8 w-16 rounded bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Title input */}
        <div className="h-12 w-4/5 rounded bg-muted" />
        {/* Toolbar */}
        <div className="h-10 w-full rounded-t-lg bg-muted" />
        {/* Editor area */}
        <div className="space-y-3 pt-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
