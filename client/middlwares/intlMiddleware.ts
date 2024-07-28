import createIntlMiddleware from 'next-intl/middleware'
import { DEFAULT_LOCALE, LOCALES } from '@middlewares/variables'

export const intlMiddleware = createIntlMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
})
