import { intlMiddleware } from '@middlewares/intlMiddleware'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from "./auth"
import { authMiddleware } from '@middlewares/authMiddleware'




export default auth(async (request: NextRequest) => {
  try {
    console.log(`Обработка запроса на путь: ${request.nextUrl.pathname}`)

    // Применяем intlMiddleware
    let response = intlMiddleware(request)
    if (!response) {
      response = NextResponse.next()
    }

    // Получаем сессию один раз
    const session = await auth()

    // Применяем authMiddleware, передавая сессию
    const authResponse = await authMiddleware(request, session)
    if (authResponse) return authResponse


    return response
  } catch (error) {
    console.error('Ошибка в middleware:', error)
    return NextResponse.error()
  }
})

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
