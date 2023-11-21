import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from '../../_utils/getLocale'

export const Translation = async ({ children }) => {
  const locale = getLocale()
  const messages = (await import(`translations/${locale}.json`))
    .default
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
