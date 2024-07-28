import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
import { DEFAULT_LOCALE, PUBLIC_PATHS } from '@middlewares/variables'


function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.endsWith(path) || pathname.endsWith(`${path}/`))
}

export async function authMiddleware(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request })

  if (isPublicPath(pathname) && token) {
    // @ts-ignore
    const userId = token.myUserInfo?.userInfo?.id
    const locale = pathname.split('/')[1] || DEFAULT_LOCALE
    return NextResponse.redirect(new URL(`/${locale}/${userId}/profile`, request.url))
  }

  if (!isPublicPath(pathname) && !token) {
    const locale = pathname.split('/')[1] || DEFAULT_LOCALE
    const signInUrl = new URL(`/${locale}/signin`, request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return null
}
