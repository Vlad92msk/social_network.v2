// auth.ts
import { MyMiddleware } from './utils'

export const authMiddleware: MyMiddleware = async (props) => {
  const { req, currentUrl } = props
  const token = req.cookies.get('next-auth.session-token')?.value
  const urlSegments = currentUrl.split('/')
  const locale = urlSegments[1] // Предполагаем, что это локаль

  // Если пользователь не авторизован и не находится на странице входа, делаем редирект на страницу входа
  if (!token && !currentUrl.endsWith('/signin')) {
    const redirectUrl = `/${locale}/signin/` // Используем локаль из текущего URL

    return {
      url: redirectUrl, // Предполагаем, что локаль уже учтена в currentUrl
      cookies: [
        // Сохранение текущего URL для возможного редиректа после аутентификации
        {
          name: 'NEXT_BACKURL_FROM_UNAUTH',
          value: currentUrl,
          maxAge: 60 * 60 * 24 * 30, // 30 дней
          path: '/',
          httpOnly: true,
        },
      ],
    }
  }

  // Если пользователь авторизован, очищаем cookie с сохранённым URL
  if (token) {
    return {
      url: currentUrl,
      cookies: [
        {
          name: 'NEXT_BACKURL_FROM_UNAUTH',
          value: '',
          maxAge: -1, // Удаление cookie
          path: '/',
          httpOnly: true,
        },
      ],
    }
  }

  return { url: currentUrl, cookies: [] }
}
