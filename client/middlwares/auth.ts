// auth.ts
import { MyMiddleware } from './utils'
import { CookieType } from '../app/types/cookie'

export const authMiddleware: MyMiddleware = (props) => {
  const { req, changedUrl } = props
  const token = req.cookies.get(CookieType.NEXT_SESSION_TOKEN)?.value
  const userIdInCookie = req.cookies.get(CookieType.USER_ID)?.value

  const urlSegments = changedUrl.split('/')
  const [, localeInUrl, userIdInURL] = urlSegments

  // Если пользователь не авторизован и не находится на странице входа, делаем редирект на страницу входа
  if (!token && !changedUrl.endsWith('/signin')) {
    const redirectUrl = `/${localeInUrl}/signin/` // Используем локаль из текущего URL

    return {
      url: redirectUrl,
      cookies: [
        // Сохранение текущего URL для возможного редиректа после аутентификации
        {
          name: CookieType.NEXT_BACKURL_FROM_UNAUTH,
          value: changedUrl,
          maxAge: 60 * 60 * 24 * 30, // 30 дней
          path: '/',
          httpOnly: true,
        },
        {
          name: CookieType.USER_ID,
          value: changedUrl,
          maxAge: -1,
          path: '/',
          httpOnly: true,
        },
      ],
    }
  }
  // Если token есть, но в URL нет userID, перенаправляем на URL с userID из cookie
  if (token && (!userIdInURL || userIdInURL === 'signin') && userIdInCookie) {
    const redirectUrl = `/${localeInUrl}/${userIdInCookie}/` // Перенаправляем на страницу с userID из cookie

    return {
      url: redirectUrl,
      cookies: [
        {
          name: CookieType.NEXT_BACKURL_FROM_UNAUTH,
          value: '',
          maxAge: -1, // Удаление cookie
          path: '/',
          httpOnly: true,
        },
      ],
    }
  }

  // Если пользователь авторизован, очищаем cookie с сохранённым URL
  if (token) {
    return {
      url: changedUrl,
      cookies: [
        {
          name: CookieType.NEXT_BACKURL_FROM_UNAUTH,
          value: '',
          maxAge: -1, // Удаление cookie
          path: '/',
          httpOnly: true,
        },
      ],
    }
  }

  return { url: changedUrl, cookies: [] }
}
