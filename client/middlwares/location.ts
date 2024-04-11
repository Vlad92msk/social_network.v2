// location.ts
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { MyMiddleware } from './utils'
import { CookieType } from '../app/types/cookie'

// Определяем поддерживаемые локали
export type Locales = 'en' | 'ru' | 'fr';
export const LOCALES: Locales[] = ['en', 'ru', 'fr']
export const DEFAULT_LOCALE: Locales = 'ru'

export const locationMiddleware: MyMiddleware = (props) => {
  const { req, changedUrl } = props
  const urlSegments = changedUrl.split('/')

  const cookieLocale = req.cookies.get(CookieType.NEXT_LOCALE)?.value as Locales
  const localeInUrl = urlSegments[1] as Locales

  const isCookieLocaleCorrect = LOCALES.includes(cookieLocale)
  const isLocaleInUrlCorrect = LOCALES.includes(localeInUrl)

  let effectiveLocale: Locales

  if (isLocaleInUrlCorrect) {
    effectiveLocale = localeInUrl
  } else if (isCookieLocaleCorrect) {
    effectiveLocale = cookieLocale
  } else {
    effectiveLocale = DEFAULT_LOCALE
  }

  const newCookieLocale: Partial<ResponseCookie> = {
    name: CookieType.NEXT_LOCALE,
    value: effectiveLocale,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  }

  // Если в URL уже есть корректная локаль, проверяем необходимость обновления куки
  if (isLocaleInUrlCorrect) {

    return {
      url: changedUrl,
      cookies: cookieLocale !== effectiveLocale ? [newCookieLocale] : [],
    }
  }

  // Замена сегмента локали в URL, если в URL нет корректной локали
  let newPath = changedUrl
  if (!isLocaleInUrlCorrect) {
    // Если URL начинается непосредственно с неверной локали или без локали
    if (localeInUrl && !isCookieLocaleCorrect) {
      // Нужно заменить или добавить локаль в начало URL
      newPath = `/${effectiveLocale}${changedUrl.startsWith('/') ? '' : '/'}${changedUrl}`
    } else {
      // Добавление локали, если в URL вообще не было локали
      urlSegments[1] = effectiveLocale
      newPath = urlSegments.join('/')
    }
  }

  return {
    url: newPath,
    cookies: [newCookieLocale],
  }
}
