// auth.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Locales } from './location'

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('next-auth.session-token')?.value
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as Locales


  /**
   * Если пользователь НЕ авторизован
   * Если не находится на странице авторизации (иначе будет бесконечный редирект)
   * Редиректим его на страницу авторизации
   */
  if (!token && !pathname.includes('signin')) {
    const newPathname = `/${cookieLocale}/signin`

    const response = NextResponse.redirect(new URL(newPathname, req.url))
    response.cookies.set('NEXT_BACKURL_FROM_UNAUTH', pathname, {
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
      httpOnly: true,
    })

    return response
  }

  if (token) {
    const response = NextResponse.next()
    response.cookies.delete('NEXT_BACKURL_FROM_UNAUTH')

    return response
  }

  return null
}
