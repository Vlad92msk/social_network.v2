import { DEFAULT_LOCALE, Locales } from '@middlewares/location'
import { getServerCookie } from './getServerCookie'
import { CookieType } from '../../types/cookie'

export const getServerLocale = () => {
  const cookieStore = getServerCookie()
  return (cookieStore.get(CookieType.NEXT_LOCALE)?.value) as Locales
}

export async function getServerLocale2() {
  try {
    const response = await fetch('http://localhost:3000/api/locale', { method: 'GET', cache: 'no-store' })
    if (!response.ok) throw new Error(`Error: ${response.statusText}`)

    const locale = await response.json()
    console.log('getServerLocale', locale)
    return locale
  } catch (error) {
    console.error('Failed to fetch locale:', error)
    // Возвращаем значение по умолчанию в случае ошибки
    return 'trrrrr' // Замените 'defaultLocale' на ваше значение по умолчанию, если нужно
  }
}
