// Регулярное выражение для публичных файлов
import { NextResponse } from 'next/server'

export const PUBLIC_FILE = /\.(.*)$/

// Функция проверки системных путей
export function isSystemPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next')
      || pathname.includes('/api/')
      || pathname.includes('/favicon')
      || PUBLIC_FILE.test(pathname)
  )
}
// Функция для последовательного вызова миддлваров
export async function runMiddlwares(req, middlewares) {
  for (const middleware of middlewares) {
    const result = await middleware(req)
    if (result instanceof NextResponse) return result
  }
  return NextResponse.next()
}
