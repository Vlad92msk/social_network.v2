'use client'

import { DEFAULT_LOCALE, Locales } from '@middlewares/location'
import { getClientCookie } from './getClientCookie'
import { CookieType } from '../../types/cookie'

export const getClientLocale = (): Locales => getClientCookie(CookieType.NEXT_LOCALE) as Locales || DEFAULT_LOCALE
