import { createTranslator } from 'next-intl'
import { getLocale } from './getLocale'

export const getTranslate = async () => {
  const locale = getLocale()
  const messages = (await import(`translations/${locale}.json`))
    .default

  return createTranslator({ locale, messages })
}
