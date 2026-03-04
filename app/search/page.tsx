import { requireFamily } from '@/lib/auth'
import { runFtsSearch, fetchFuzzyData } from '@/lib/search/postgres'
import SearchClient from '@/components/search/SearchClient'

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function firstDayOfMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

interface SearchPageProps {
  searchParams: { q?: string; from?: string; to?: string }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { familyId } = await requireFamily()

  const today = new Date()
  const query = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const from = typeof searchParams.from === 'string' ? searchParams.from : firstDayOfMonth(today)
  const to = typeof searchParams.to === 'string' ? searchParams.to : toDateString(today)

  // async-parallel: start both queries simultaneously
  const [ftsResults, fuzzyData] = await Promise.all([
    query ? runFtsSearch(familyId, query, from, to) : Promise.resolve([]),
    fetchFuzzyData(familyId, from, to),
  ])

  // server-serialization: only plain serializable data crosses the boundary
  return (
    <SearchClient
      key={`${query}-${from}-${to}`}
      query={query}
      from={from}
      to={to}
      ftsResults={ftsResults}
      fuzzyData={fuzzyData}
    />
  )
}
