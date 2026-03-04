const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function computeGridGeometry(year: number, month: number) {
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalSlots = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7
  return {
    firstDayOfWeek,
    daysInMonth,
    trailingBlanks: totalSlots - firstDayOfWeek - daysInMonth,
  }
}

export function MonthGridSkeleton({ year, month }: { year: number; month: number }) {
  const { firstDayOfWeek, daysInMonth, trailingBlanks } = computeGridGeometry(year, month)

  const cells: Array<number | null> = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(trailingBlanks).fill(null),
  ]

  return (
    <div>
      {/* Day-of-week headers — real labels, not skeletonized */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs uppercase tracking-widest text-stone-400 py-2 select-none"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Skeleton grid */}
      <div className="grid grid-cols-7 border-l border-t border-stone-100">
        {cells.map((day, index) =>
          day === null ? (
            <div
              key={`blank-${index}`}
              className="border-r border-b border-stone-100 bg-stone-50/50 h-16 md:h-28"
            />
          ) : (
            <div
              key={`skel-${day}`}
              className="border-r border-b border-stone-100 bg-white h-16 md:h-28 p-1.5 md:p-2 flex flex-col gap-1.5"
            >
              {/* Day number placeholder */}
              <div className="h-3 w-4 rounded bg-stone-200 animate-pulse" />
              {/* Content line — desktop only */}
              <div className="hidden md:block h-2 w-3/4 rounded bg-stone-200 animate-pulse mt-1" />
              {/* Second line for every 3rd cell — natural variation */}
              {day % 3 === 0 ? (
                <div className="hidden md:block h-2 w-1/2 rounded bg-stone-200 animate-pulse" />
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  )
}
