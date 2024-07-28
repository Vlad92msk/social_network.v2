import 'server-only'
import { Locale } from '@middlewares/variables'


const translations = {
  en: () => import('./en.json').then(module => module.default),
  ru: () => import(`./ru.json`).then(module => module.default),
  fr: () => import(`./fr.json`).then(module => module.default),
}


export const getTranslate = async (locale: Locale) => translations[locale]()
