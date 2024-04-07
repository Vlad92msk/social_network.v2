import type { NextRequest } from 'next/server'
import { authMiddleware } from './middlwares/auth'
import { locationMiddleware } from './middlwares/location'
import { runMiddlewares } from './middlwares/utils'

export default function middleware(req: NextRequest) {
  // Вызываем мидлвары поочереди
  return runMiddlewares(
    req,
    [
      locationMiddleware,
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
    '/((?!api|_next/static|_next/image|favicon|images).*)',
  ],
}
