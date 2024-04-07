import { Locales } from '@middlewares/location'
import { getServerCookie } from './getServerCookie'
import { CookieType } from '../../types/cookie'

export const getServerLocale = () => {
  const cookieStore = getServerCookie()
  return (cookieStore.get(CookieType.NEXT_LOCALE)?.value) as Locales
}
