export default function JournalViewLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Top bar skeleton */}
      <div className="sticky top-14 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-2">
        <div className="h-8 w-16 rounded bg-muted" />
        <div className="h-8 w-16 rounded bg-muted" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Title */}
        <div className="h-10 w-3/4 rounded bg-muted" />
        {/* Paragraphs */}
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
