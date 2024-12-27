import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'
import { LOCALES } from '@middlewares/variables'
import { headers } from 'next/headers'

export default getRequestConfig(async () => {
  // Получаем headers асинхронно
  const headersList = await headers()
  // Получаем локаль из заголовков
  const locale = headersList.get('X-NEXT-INTL-LOCALE')

  if (!LOCALES.includes(locale as any)) notFound()

  return {
    messages: (await import(`./translations/${locale}.json`)).default
  }
})
