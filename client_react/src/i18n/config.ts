// src/i18n/config.ts
import { Locale } from './types.ts'
import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

// Типы для локалей
export const LOCALES: Locale[] = ['en', 'ru', 'fr']
export const DEFAULT_LOCALE: Locale = 'ru'

// Утилиты для работы с cookies
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Функция для загрузки переводов
const loadTranslations = async (locale: Locale) => {
  try {
    const response = await fetch(`/translations/${locale}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load ${locale} translations`)
    }
    return await response.json()
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}:`, error)
    return {}
  }
}

// Функция для получения сохраненной локали
const getSavedLocale = (): Locale => {
  // Сначала проверяем cookie (для совместимости с NextJS)
  const cookieLocale = getCookie('NEXT_LOCALE')
  if (cookieLocale && LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  // Затем проверяем localStorage
  const storageLocale = localStorage.getItem('preferred-locale')
  if (storageLocale && LOCALES.includes(storageLocale as Locale)) {
    return storageLocale as Locale
  }

  // Проверяем язык браузера
  const browserLocale = navigator.language.split('-')[0] as Locale
  if (LOCALES.includes(browserLocale)) {
    return browserLocale
  }

  return DEFAULT_LOCALE
}

// Функция для сохранения локали
const saveLocale = (locale: Locale) => {
  localStorage.setItem('preferred-locale', locale)
  setCookie('NEXT_LOCALE', locale)
}

// Инициализация i18n
const initI18n = async () => {
  const savedLocale = getSavedLocale()

  // Загружаем переводы для всех поддерживаемых языков
  const resources: Record<string, { translation: any }> = {}

  await Promise.allSettled(
    LOCALES.map(async (locale) => {
      const translations = await loadTranslations(locale)
      resources[locale] = { translation: translations }
    })
  )

  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLocale,
    fallbackLng: DEFAULT_LOCALE,

    react: {
      useSuspense: false,
    },

    interpolation: {
      escapeValue: false,
    },

    returnEmptyString: false,
    returnNull: false,

    // Дополнительные настройки
    debug: process.env.NODE_ENV === 'development',

    // Настройки для обработки отсутствующих ключей
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`)
      }
    },
  })

  return i18n
}

// Обработчик смены языка
i18n.on('languageChanged', (lng: string) => {
  const locale = lng as Locale

  // Обновляем атрибут lang документа
  document.documentElement.lang = locale

  // Сохраняем выбор пользователя
  saveLocale(locale)
})

// Функция для смены языка (удобная обертка)
export const changeLanguage = async (locale: Locale) => {
  if (!LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}`)
    return
  }

  await i18n.changeLanguage(locale)
}

// Инициализируем i18n и экспортируем промис для ожидания готовности
export const i18nInitPromise = initI18n()

export default i18n
