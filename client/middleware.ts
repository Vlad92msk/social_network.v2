import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@middlewares/authMiddleware'
import { intlMiddleware } from '@middlewares/intlMiddleware'
import { auth } from './auth'

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

    const { 1: locale, 2: uuid } = request.nextUrl.pathname.split('/')


    /**
     * Если в URL нет UUID пользователя - устанавливаем его из авторизации
     * В дальнейшем нужно расширить это
     * чтобы можно было проверять UUID в базе и есть он есть - редиректить на него
     * если нет - то на страницу текщего пользователя
     */
    if (!uuid) {
      // @ts-ignore
      const userId = session?.user?.userInfo?.uuid
      if (userId) {
        // Если uuid отсутствует в URL, но есть в сессии, перенаправляем на URL с uuid
        return NextResponse.redirect(new URL(`/${locale}/${userId}/profile`, request.url))
      } else {
        // Если uuid нет ни в URL, ни в сессии, возможно, стоит перенаправить на страницу входа или домашнюю страницу
        console.log('UUID не найден ни в URL, ни в сессии')
        // Пример: return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      }
    }


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
