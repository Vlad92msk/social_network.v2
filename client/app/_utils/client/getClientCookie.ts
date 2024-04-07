'use client'

import { CookieType } from '../../types/cookie'

export const getClientCookie = (name: CookieType): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const matches = document?.cookie
    .match(new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`))
  return matches ? decodeURIComponent(matches[1]) : undefined
}
