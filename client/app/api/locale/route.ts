// pages/api/locale.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { DEFAULT_LOCALE } from '@middlewares/location'
import { CookieType } from '../../types/cookie'

/**
 * Пока непонятно как работает и как использовать
 * Все время старое значение возвращается
 */
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Получаем заголовок cookie из запроса
  const cookieHeader = req.headers.cookie || ''
  // Парсим cookie в объект
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as { [key: string]: string })

  const locale = cookies[CookieType.NEXT_LOCALE] || DEFAULT_LOCALE // Задайте значение по умолчанию
  return new Response(JSON.stringify(locale), { status: 200 })
}
