export type Locale = 'en' | 'ru' | 'fr'

// Тип для ключей переводов (можно расширить по мере добавления переводов)
export type TranslationKey = 'nav.home'

// Интерфейс для структуры переводов
export interface TranslationResource {
  nav: {
    home: string
    about: string
    contact: string
  }
  common: {
    loading: string
    error: string
    save: string
    cancel: string
  }
  // Добавляйте новые секции сюда
}

// Расширяем типы react-i18next для типобезопасности
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: TranslationResource
    }
  }
}
