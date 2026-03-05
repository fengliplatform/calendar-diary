'use client'

import { usePathname } from 'next/navigation'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
  return <div className={isAuthPage ? undefined : 'pt-14'}>{children}</div>
}
