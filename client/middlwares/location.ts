// location.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSystemPath } from './utils'

// Определяем поддерживаемые локали
export type Locales = 'en' | 'ru' | 'fr';
export const LOCALES: Locales[] = ['en', 'ru', 'fr']
export const DEFAULT_LOCALE: Locales = 'ru'

// Функция определения необходимости обработки локали
export function shouldHandleLocale(pathname: string, locales: Locales[]): boolean {
  return !isSystemPath(pathname) && locales.includes(pathname.split('/')[1] as Locales)
}

// Функция редиректа на указанную локаль с установкой соответствующей куки
export function redirectToLocale(locale: string, pathname: string, search: string, req: NextRequest) {
  const newPathname = `/${locale}${pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '')}${search}`
  const response = NextResponse.redirect(new URL(newPathname, req.url))
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 30, // 30 дней
    path: '/',
    httpOnly: true,
  })
  return response
}

export function locationMiddleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  const localeInUrl = pathname.split('/')[1] as Locales
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as Locales

  // Редирект и установка куки, если локаль в URL отличается от куки
  if (shouldHandleLocale(pathname, LOCALES) && localeInUrl !== cookieLocale) {
    return redirectToLocale(localeInUrl, pathname, search, req)
  }

  // Редирект на локаль по умолчанию, если текущая локаль невалидна, и установка куки
  if (!LOCALES.includes(localeInUrl)) {
    return redirectToLocale(DEFAULT_LOCALE, pathname, search, req)
  }

  // Установка куки по умолчанию, если куки не существует
  if (!cookieLocale) {
    return redirectToLocale(DEFAULT_LOCALE, '/', search, req)
  }

  return null
}
