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
  currentUrl: string
  options: any
}

export type MyMiddleware = (props: MyMiddlewareProps) => Promise<MyMiddlewareResponse>

export async function runMiddlewares(
  req: NextRequest,
  middlewares: Array<MyMiddleware>,
  options?: any,
) {
  let currentUrl = req.nextUrl.pathname
  const responseCookies: MyMiddlewareResponse['cookies'] = []

  // eslint-disable-next-line no-restricted-syntax
  for (const middleware of middlewares) {
    // eslint-disable-next-line no-await-in-loop
    const result: MyMiddlewareResponse = await middleware({ req, currentUrl, options })
    currentUrl = result.url

    if (result.cookies) {
      responseCookies.push(...result.cookies)
    }
  }

  const response = currentUrl !== req.nextUrl.pathname ? NextResponse.redirect(new URL(currentUrl, req.url)) : NextResponse.next()

  responseCookies.forEach((newCookie) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    response.cookies.set(newCookie)
  })

  return response
}
