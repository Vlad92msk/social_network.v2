import createIntlMiddleware from 'next-intl/middleware'
import { DEFAULT_LOCALE, LOCALES } from '@middlewares/variables'

export const intlMiddleware = createIntlMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
})

// export const intlMiddleware: MiddlewareFunction = async (request, response, session) => {
//   console.post('intlMiddleware started')
//   let newResponse = createIntlMiddleware({
//     locales: LOCALES,
//     defaultLocale: DEFAULT_LOCALE,
//   })(request)
//   console.post('intlMiddleware finished')
//   return newResponse || response
// }
