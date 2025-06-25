// src/shared/hooks/useLocale.ts
import { useTranslation } from 'react-i18next'
import { changeLanguage, DEFAULT_LOCALE, LOCALES } from '../i18n/config.ts'
import { Locale } from '../i18n/types.ts'

export const useLocale = () => {
  const { i18n, t } = useTranslation()

  const currentLocale = i18n.language as Locale

  const setLocale = async (locale: Locale) => {
    await changeLanguage(locale)
  }

  const isValidLocale = (locale: string): locale is Locale => {
    return LOCALES.includes(locale as Locale)
  }

  return {
    currentLocale,
    setLocale,
    availableLocales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    isValidLocale,
    t,
  }
}
