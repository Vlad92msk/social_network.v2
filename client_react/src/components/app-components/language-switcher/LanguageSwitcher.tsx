import { useLocale } from '@hooks'

import { Locale } from '../../../i18n/types.ts'

// @ts-ignore
import styles from './LanguageSwitcher.module.css'

const LOCALE_NAMES: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  fr: 'Français',
} as const

export const LanguageSwitcher = () => {
  const { currentLocale, setLocale, availableLocales } = useLocale()

  const handleLocaleChange = (locale: Locale) => {
    setLocale(locale)
  }

  return (
    <div className={styles.languageSwitcher}>
      <select value={currentLocale} onChange={(e) => handleLocaleChange(e.target.value as Locale)} className={styles.select}>
        {availableLocales.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_NAMES[locale]}
          </option>
        ))}
      </select>
    </div>
  )
}
