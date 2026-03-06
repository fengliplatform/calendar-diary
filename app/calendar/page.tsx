import { redirect } from 'next/navigation'

export default function CalendarIndex() {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  redirect(`/calendar/${ym}`)
}
