export default function DayDetailLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky sub-header skeleton */}
      <div className="sticky top-14 z-10 border-b bg-stone-50/95 px-4 md:px-8 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="h-4 w-28 rounded bg-stone-200 animate-pulse" />
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 md:px-8 py-6 pb-24 space-y-4">
        {/* Day heading */}
        <div className="pt-2 pb-1 space-y-2">
          <div className="h-8 w-64 rounded bg-stone-200 animate-pulse" />
        </div>

        {/* Section cards */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-100 bg-white shadow-sm p-5 space-y-3 animate-pulse"
          >
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="h-4 w-3/4 rounded bg-stone-200" />
            <div className="h-4 w-1/2 rounded bg-stone-200" />
          </div>
        ))}
      </main>
    </div>
  )
}
