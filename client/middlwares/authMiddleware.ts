import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LOCALE, PUBLIC_PATHS } from '@middlewares/variables'
import { Session } from 'next-auth'



function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.endsWith(path) || pathname.endsWith(`${path}/`))
}

export async function authMiddleware(request: NextRequest, session: Session | null) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname) && session) {
    // @ts-ignore
    const userId = session.user?.userInfo?.id
    const locale = pathname.split('/')[1] || DEFAULT_LOCALE
    return NextResponse.redirect(new URL(`/${locale}/${userId}/profile`, request.url))
  }

  if (!isPublicPath(pathname) && !session) {
    const locale = pathname.split('/')[1] || DEFAULT_LOCALE
    const signInUrl = new URL(`/${locale}/signin`, request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return null
}
