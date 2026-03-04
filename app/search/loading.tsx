export default function SearchLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="h-8 w-24 bg-stone-100 rounded animate-pulse mb-6" />
      <div className="h-10 bg-stone-100 rounded-md animate-pulse" />
      <div className="flex gap-3">
        <div className="h-9 flex-1 bg-stone-100 rounded-md animate-pulse" />
        <div className="h-9 flex-1 bg-stone-100 rounded-md animate-pulse" />
      </div>
      <div className="pt-2 space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="border border-stone-100 rounded-lg p-4 space-y-2 animate-pulse"
          >
            <div className="h-4 w-40 bg-stone-100 rounded" />
            <div className="h-3 w-24 bg-stone-100 rounded" />
            <div className="h-4 w-full bg-stone-100 rounded" />
            <div className="h-4 w-3/4 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
