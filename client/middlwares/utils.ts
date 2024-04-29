// Регулярное выражение для публичных файлов
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { NextRequest, NextResponse } from 'next/server'

// Пример типа возвращаемого значения middleware
export interface MyMiddlewareResponse {
  url: string // Новый URL
  cookies?: Partial<ResponseCookie>[] // Изменения кук
}

export interface MyMiddlewareProps {
  req: NextRequest
  changedUrl: string
  options: unknown
}

export type MyMiddleware = (props: MyMiddlewareProps) => MyMiddlewareResponse

export async function runMiddlewares(
  req: NextRequest,
  middlewares: Array<MyMiddleware>,
  options?: unknown,
) {
  let currentUrl = req.nextUrl.pathname
  const responseCookies: MyMiddlewareResponse['cookies'] = []
  let newURL: string | undefined

  middlewares.forEach((middleware) => {
    const result: MyMiddlewareResponse = middleware({ req, changedUrl: newURL || req.nextUrl.pathname, options })
    newURL = result.url
    currentUrl = result.url

    if (result.cookies) {
      responseCookies.push(...result.cookies)
    }
  })

  const [, locale, userId, contentType] = currentUrl.split('/')
  if (!Boolean(contentType) && Boolean(userId) && Boolean(locale)) {
    currentUrl += 'profile'
  }

  // console.log('currentUrl', contentType)

  const response = currentUrl !== req.nextUrl.pathname ? NextResponse.redirect(new URL(currentUrl, req.url)) : NextResponse.next()

  responseCookies.forEach((newCookie) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    response.cookies.set(newCookie)
  })

  return response
}
