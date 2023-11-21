import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authMiddleware } from './middlwares/auth'
import { locationMiddleware } from './middlwares/location'
import { isSystemPath, runMiddlwares } from './middlwares/utils'

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isThisSystemPath = isSystemPath(pathname)

  if (isThisSystemPath) return NextResponse.next()

  // Вызываем мидлвары поочереди
  return runMiddlwares(
    req,
    [
      locationMiddleware.bind({ isSystemPath: isThisSystemPath }),
      authMiddleware,
    ],
  )
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon).*)',
  ],
  // matcher: ['/((?!api|static|favicon.svg).*)'],
}
