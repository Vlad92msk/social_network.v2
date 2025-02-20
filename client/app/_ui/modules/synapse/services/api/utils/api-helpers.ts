/**
 * utils/api-helpers.ts
 * Вспомогательные функции для работы с API
 */
import { ApiContext } from '../types/api.interface'

/**
 * Преобразует Headers в объект
 * @param headers Объект Headers
 * @returns Простой объект с заголовками
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

/**
 * Фильтрует заголовки, оставляя только те, которые влияют на кэш
 * @param headers Объект с заголовками
 * @param cacheableKeys Массив ключей заголовков, влияющих на кэш
 * @returns Отфильтрованные заголовки
 */
export function filterCacheableHeaders(
  headers: Record<string, string>,
  cacheableKeys: string[] = [],
): Record<string, string> {
  if (!cacheableKeys?.length) return {}

  return Object.entries(headers)
    .filter(([key]) => {
      const lowerKey = key.toLowerCase()
      return cacheableKeys.includes(lowerKey) || cacheableKeys.includes(key)
    })
    .reduce((obj, [key, value]) => {
      obj[key] = value
      return obj
    }, {} as Record<string, string>)
}

/**
 * Создает контекст API с доступом к хранилищу и cookies
 * @param customContext Пользовательский контекст
 * @param requestParams Параметры запроса
 * @returns Объект контекста API
 */
export function createApiContext(
  customContext: Record<string, any> = {},
  requestParams: any = {},
): ApiContext {
  return {
    ...customContext,
    requestParams,
    getFromStorage: <T>(key: string): T | undefined => {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : undefined
      } catch (error) {
        console.warn(`[API] Error reading from storage: ${error}`)
        return undefined
      }
    },
    getCookie: (name: string): string | undefined => {
      try {
        const matches = document.cookie.match(
          new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`),
        )
        return matches ? decodeURIComponent(matches[1]) : undefined
      } catch (error) {
        console.warn(`[API] Error reading cookie: ${error}`)
        return undefined
      }
    },
  }
}

/**
 * Создает уникальный идентификатор для эндпоинта
 * @returns Уникальный идентификатор
 */
export function createUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * Логгер для API-модуля
 */
export const apiLogger = {
  /**
   * Логирует сообщение с уровнем info
   * @param message Сообщение
   * @param data Дополнительные данные
   */
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[API] ${message}`, data)
    }
  },

  /**
   * Логирует предупреждение
   * @param message Сообщение
   * @param data Дополнительные данные
   */
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[API] ${message}`, data)
    }
  },

  /**
   * Логирует ошибку
   * @param message Сообщение
   * @param error Объект ошибки
   */
  error: (message: string, error?: any) => {
    console.error(`[API] ${message}`, error)
  },

  /**
   * Логирует отладочную информацию
   * @param message Сообщение
   * @param data Дополнительные данные
   */
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${message}`, data)
    }
  },
}
