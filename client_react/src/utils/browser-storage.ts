/**
 * Универсальные утилиты для работы с браузерными хранилищами
 *
 * Поддерживает:
 * - Cookies
 * - localStorage
 * - sessionStorage
 * - Безопасную работу в SSR/Node.js окружении
 */

// Типы для TypeScript проектов
export interface CookieOptions {
  expires?: Date | number // Date object или количество дней
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
  httpOnly?: boolean // Только для серверной установки
}

export interface StorageUtils {
  // Cookie методы
  setCookie(name: string, value: string, options?: CookieOptions): void
  getCookie(name: string): string | null
  removeCookie(name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void
  getAllCookies(): Record<string, string>

  // localStorage методы
  setLocalStorage<T>(key: string, value: T): boolean
  getLocalStorage<T>(key: string): T | null
  removeLocalStorage(key: string): boolean
  clearLocalStorage(): boolean
  getLocalStorageKeys(): string[]

  // sessionStorage методы
  setSessionStorage<T>(key: string, value: T): boolean
  getSessionStorage<T>(key: string): T | null
  removeSessionStorage(key: string): boolean
  clearSessionStorage(): boolean
  getSessionStorageKeys(): string[]

  // Утилиты проверки
  isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean
  isCookiesAvailable(): boolean
  isSSR(): boolean
}

class BrowserStorageUtils implements StorageUtils {
  // ==================== COOKIES ====================

  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (this.isSSR()) {
      console.warn('Cookies не доступны в SSR окружении')
      return
    }

    const {
      expires = 7, // По умолчанию 7 дней
      path = '/',
      domain,
      secure,
      sameSite = 'Lax',
    } = options

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    // Обработка expires
    if (expires) {
      const expiresDate = typeof expires === 'number' ? new Date(Date.now() + expires * 24 * 60 * 60 * 1000) : expires
      cookieString += `;expires=${expiresDate.toUTCString()}`
    }

    if (path) cookieString += `;path=${path}`
    if (domain) cookieString += `;domain=${domain}`
    if (secure) cookieString += ';secure'
    if (sameSite) cookieString += `;SameSite=${sameSite}`

    try {
      document.cookie = cookieString
    } catch (error) {
      console.warn('Ошибка установки cookie:', error)
    }
  }

  getCookie(name: string): string | null {
    if (this.isSSR()) return null

    try {
      const nameEQ = encodeURIComponent(name) + '='
      const cookies = document.cookie.split(';')

      for (let cookie of cookies) {
        cookie = cookie.trim()
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length))
        }
      }
      return null
    } catch (error) {
      console.warn('Ошибка чтения cookie:', error)
      return null
    }
  }

  removeCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    this.setCookie(name, '', {
      ...options,
      expires: new Date(0),
    })
  }

  getAllCookies(): Record<string, string> {
    if (this.isSSR()) return {}

    try {
      const cookies: Record<string, string> = {}
      document.cookie.split(';').forEach((cookie) => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          cookies[decodeURIComponent(name)] = decodeURIComponent(value)
        }
      })
      return cookies
    } catch (error) {
      console.warn('Ошибка получения всех cookies:', error)
      return {}
    }
  }

  // ==================== LOCAL STORAGE ====================

  setLocalStorage<T>(key: string, value: T): boolean {
    if (!this.isStorageAvailable('localStorage')) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('Ошибка записи в localStorage:', error)
      return false
    }
  }

  getLocalStorage<T>(key: string): T | null {
    if (!this.isStorageAvailable('localStorage')) return null

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn('Ошибка чтения localStorage:', error)
      return null
    }
  }

  removeLocalStorage(key: string): boolean {
    if (!this.isStorageAvailable('localStorage')) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('Ошибка удаления из localStorage:', error)
      return false
    }
  }

  clearLocalStorage(): boolean {
    if (!this.isStorageAvailable('localStorage')) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Ошибка очистки localStorage:', error)
      return false
    }
  }

  getLocalStorageKeys(): string[] {
    if (!this.isStorageAvailable('localStorage')) return []

    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.warn('Ошибка получения ключей localStorage:', error)
      return []
    }
  }

  // ==================== SESSION STORAGE ====================

  setSessionStorage<T>(key: string, value: T): boolean {
    if (!this.isStorageAvailable('sessionStorage')) return false

    try {
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('Ошибка записи в sessionStorage:', error)
      return false
    }
  }

  getSessionStorage<T>(key: string): T | null {
    if (!this.isStorageAvailable('sessionStorage')) return null

    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn('Ошибка чтения sessionStorage:', error)
      return null
    }
  }

  removeSessionStorage(key: string): boolean {
    if (!this.isStorageAvailable('sessionStorage')) return false

    try {
      sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('Ошибка удаления из sessionStorage:', error)
      return false
    }
  }

  clearSessionStorage(): boolean {
    if (!this.isStorageAvailable('sessionStorage')) return false

    try {
      sessionStorage.clear()
      return true
    } catch (error) {
      console.warn('Ошибка очистки sessionStorage:', error)
      return false
    }
  }

  getSessionStorageKeys(): string[] {
    if (!this.isStorageAvailable('sessionStorage')) return []

    try {
      return Object.keys(sessionStorage)
    } catch (error) {
      console.warn('Ошибка получения ключей sessionStorage:', error)
      return []
    }
  }

  // ==================== УТИЛИТЫ ПРОВЕРКИ ====================

  isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    if (this.isSSR()) return false

    try {
      const storage = window[type]
      const testKey = '__storage_test__'
      storage.setItem(testKey, 'test')
      storage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  isCookiesAvailable(): boolean {
    if (this.isSSR()) return false

    try {
      const testCookie = '__cookie_test__'
      document.cookie = `${testCookie}=test;path=/`
      const available = document.cookie.indexOf(testCookie) !== -1
      // Очищаем тестовый cookie
      document.cookie = `${testCookie}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
      return available
    } catch (error) {
      return false
    }
  }

  isSSR(): boolean {
    return typeof window === 'undefined' || typeof document === 'undefined'
  }
}

// Создаем единственный экземпляр
export const browserStorage = new BrowserStorageUtils()

// Экспортируем удобные сокращения для частого использования
export const { setCookie, getCookie, removeCookie, setLocalStorage, getLocalStorage, removeLocalStorage, setSessionStorage, getSessionStorage, removeSessionStorage } =
  browserStorage

// Дополнительные утилиты для удобства
export const storageHelpers = {
  // Сохранение объекта с автоматическим выбором хранилища
  saveData<T>(key: string, value: T, persistent = true): boolean {
    return persistent ? browserStorage.setLocalStorage(key, value) : browserStorage.setSessionStorage(key, value)
  },

  // Получение данных с проверкой в обоих хранилищах
  getData<T>(key: string): T | null {
    return browserStorage.getLocalStorage<T>(key) || browserStorage.getSessionStorage<T>(key)
  },

  // Удаление из всех хранилищ
  removeData(key: string): void {
    browserStorage.removeLocalStorage(key)
    browserStorage.removeSessionStorage(key)
    browserStorage.removeCookie(key)
  },

  // Полная очистка пользовательских данных
  clearAllUserData(userKeys: string[] = []): void {
    userKeys.forEach((key) => {
      browserStorage.removeLocalStorage(key)
      browserStorage.removeSessionStorage(key)
      browserStorage.removeCookie(key)
    })
  },

  // Сохранение с TTL (Time To Live)
  setWithExpiry<T>(key: string, value: T, ttlMs: number): boolean {
    const item = {
      value,
      expiry: Date.now() + ttlMs,
    }
    return browserStorage.setLocalStorage(key, item)
  },

  // Получение с проверкой TTL
  getWithExpiry<T>(key: string): T | null {
    const item = browserStorage.getLocalStorage<{ value: T; expiry: number }>(key)

    if (!item) return null

    if (Date.now() > item.expiry) {
      browserStorage.removeLocalStorage(key)
      return null
    }

    return item.value
  },
}

// Экспорт по умолчанию для удобства
export default browserStorage

// ==================== ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ ====================

/*
// Базовое использование
import { storage, setCookie, getLocalStorage } from './storage'

// Cookies
setCookie('theme', 'dark', { expires: 30, sameSite: 'Lax' })
const theme = getCookie('theme')

// LocalStorage
setLocalStorage('user', { id: 1, name: 'John' })
const user = getLocalStorage<{id: number, name: string}>('user')

// Проверки
if (storage.isStorageAvailable('localStorage')) {
  // безопасно использовать localStorage
}

// Продвинутое использование
import { storageHelpers } from './storage'

// Сохранение с TTL (1 час)
storageHelpers.setWithExpiry('temp_data', {some: 'data'}, 60 * 60 * 1000)

// Автоматический выбор хранилища
storageHelpers.saveData('preferences', {theme: 'dark'}, true) // localStorage
storageHelpers.saveData('temp_state', {active: true}, false) // sessionStorage

// Получение из любого хранилища
const preferences = storageHelpers.getData('preferences')

// Полная очистка
storageHelpers.clearAllUserData(['user', 'preferences', 'temp_data'])
*/
