import { Locales } from '@middlewares/location'

export const getMessages = async (locale: Locales) => (await import(`translations/${locale}.json`))
  .default
