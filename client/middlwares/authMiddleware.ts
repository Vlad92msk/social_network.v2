import { NextRequest, NextResponse } from 'next/server'
import { Session } from 'next-auth'
import { DEFAULT_LOCALE, PUBLIC_PATHS } from '@middlewares/variables'

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname.endsWith(path) || pathname.endsWith(`${path}/`),
  )
}

export async function authMiddleware(request: NextRequest, session: Session | null) {
  const { pathname } = request.nextUrl
  const locale = pathname.split('/')[1] || DEFAULT_LOCALE

  // Редирект авторизованного пользователя с публичных страниц
  if (isPublicPath(pathname) && session) {
    // @ts-ignore
    const userId = session.user?.userInfo?.uuid
    return NextResponse.redirect(
      new URL(`/${locale}/${userId}/profile`, request.url),
    )
  }

  // Редирект неавторизованного пользователя на страницу входа
  if (!isPublicPath(pathname) && !session) {
    const signInUrl = new URL(`/${locale}/signin`, request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return null
}
