import { NextRequest, NextResponse } from 'next/server'
import { Session } from 'next-auth'
import { authMiddleware } from '@middlewares/authMiddleware'
import { intlMiddleware } from '@middlewares/intlMiddleware'
import { CookieType } from './app/types/cookie'
import { auth } from './auth'
import { profileApiInstance } from './store/instance'

// Helpers
const createCookieOptions = (maxAge: number) => ({
  maxAge,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
})

const calculateMaxAge = (expiresDate: Date): number => Math.floor((expiresDate.getTime() - Date.now()) / 1000)

// Middlewares
const handleIntl = (request: NextRequest) => {
  const response = intlMiddleware(request)
  return response || NextResponse.next()
}

const handleAuth = async (request: NextRequest, session: Session | null) => (
  authMiddleware(request, session)
)

const attachProfileCookies = async (response: NextResponse, session: Session, maxAge: number) => {
  if (!session?.user?.email) return

  const profile = await profileApiInstance
    .getProfileInfo({ body: { email: session.user.email } })
    .then((res) => res)

  if (!profile) return

  const cookieOptions = createCookieOptions(maxAge)

  response.cookies.set(CookieType.USER_PROFILE_ID, String(profile.id), cookieOptions)
  response.cookies.set(CookieType.USER_INFO_ID, String(profile.user_info.id), cookieOptions)

  return profile.user_info.public_id
}

const handleUUID = async (request: NextRequest, userPublicId: string | undefined) => {
  const { pathname } = request.nextUrl
  const [, locale, uuid] = pathname.split('/')

  if (uuid === 'undefined' || uuid === '') {
    if (userPublicId) {
      return NextResponse.redirect(
        new URL(`/${locale}/${userPublicId}/profile`, request.url),
      )
    }
    console.log('UUID не найден ни в URL, ни в сессии')
  }
  return null
}

// Main middleware
export default auth(async (request: NextRequest) => {
  try {
    console.log(`Обработка запроса на путь: ${request.nextUrl.pathname}`)

    // 1. Обработка интернационализации
    const response = handleIntl(request)

    // 2. Получение и проверка сессии
    const session = await auth()
    const authResponse = await handleAuth(request, session)
    if (authResponse) return authResponse

    // 3. Установка куки профиля
    let userPublicId
    if (session) {
      const maxAge = calculateMaxAge(new Date(session.expires))
      userPublicId = await attachProfileCookies(response, session, maxAge)
    }

    // 4. Обработка UUID в URL
    const uuidResponse = await handleUUID(request, userPublicId)
    if (uuidResponse) return uuidResponse

    return response
  } catch (error) {
    console.error('Ошибка в middleware:', error)
    return NextResponse.error()
  }
})

export const config = {
  matcher: [
    /**
     * Исключаем API маршруты
      * '/((?!api).*)'
      *
      *  Исключаем статические файлы Next.js
      * '/((?!_next/static).*)'
      *
      * Исключаем оптимизированные изображения Next.js
      * '/((?!_next/image).*)'
      *
      * Исключаем обращения к папке images
      * '/((?!images).*)'
      *
      * Исключаем обращения к папке icons
      * '/((?!icons).*)'
     */
    '/((?!api|_next/static|_next/image|audio|images|icons|favicon/*).*)',
  ],
}
