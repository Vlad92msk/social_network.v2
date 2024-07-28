import { authMiddleware } from '@middlewares/authMiddleware'
import { intlMiddleware } from '@middlewares/intlMiddleware'
import { NextRequest, NextResponse } from 'next/server'

export default async function middleware(request: NextRequest) {
  try {
    console.log(`Processing request for path: ${request.nextUrl.pathname}`)

    // Применяем intlMiddleware
    let response = intlMiddleware(request)
    if (!response) {
      response = NextResponse.next()
    }

    // Применяем authMiddleware
    const authResponse = await authMiddleware(request, response)
    if (authResponse) {
      return authResponse
    }

    console.log('Proceeding with the request')
    return response
  } catch (error) {
    console.error('Error in middleware:', error)
    return NextResponse.error()
  }
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
