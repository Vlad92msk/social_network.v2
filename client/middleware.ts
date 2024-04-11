import { NextRequest } from 'next/server'
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
    /**
     * Исключаем API маршруты
      * '/((?!api).*)'
      *
      *  Исключаем статические файлы Next.js
      * '/((?!_next/static).*)'
      *
      * Исключаем оптимизированные изображения Next.js
      * '/((?!_next/image).*)'
      *
      * Исключаем обращения к папке images
      * '/((?!images).*)'
      *
      * Исключаем обращения к папке icons
      * '/((?!icons).*)'
     */
    '/((?!api|_next/static|_next/image|images|icons|favicon/*).*)',
  ],
}
