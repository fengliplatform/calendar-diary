import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher([
  '/calendar(.*)',
  '/journal(.*)',
  '/settings(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const { userId, orgId } = await auth()

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // No org → redirect to /settings so user can create/join a family
    // Allow /settings itself through to avoid redirect loop
    if (!orgId && !req.nextUrl.pathname.startsWith('/settings')) {
      return NextResponse.redirect(new URL('/settings', req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
