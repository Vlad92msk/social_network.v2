import { AUTH_CONSTANTS } from '../constants'

// Управление callbackUrl
export const callbackStorage = {
  set: (url: string): void => {
    if (import.meta.env.DEV) {
      console.log('🔄 Сохраняем callbackUrl:', url)
    }
    sessionStorage.setItem(AUTH_CONSTANTS.CALLBACK_URL_KEY, url)
  },

  get: (): string | null => {
    const url = sessionStorage.getItem(AUTH_CONSTANTS.CALLBACK_URL_KEY)
    if (import.meta.env.DEV && url) {
      console.log('📍 Получаем callbackUrl:', url)
    }
    return url
  },

  remove: (): void => {
    if (import.meta.env.DEV) {
      console.log('🗑️ Удаляем callbackUrl')
    }
    sessionStorage.removeItem(AUTH_CONSTANTS.CALLBACK_URL_KEY)
  },

  clear: (): void => {
    if (import.meta.env.DEV) {
      console.log('🧹 Очищаем callbackUrl при выходе')
    }
    sessionStorage.removeItem(AUTH_CONSTANTS.CALLBACK_URL_KEY)
  }
}

// Управление guard data
export const guardDataStorage = {
  set: (key: string, data: any): void => {
    try {
      const guardData = guardDataStorage.getAll()
      guardData[key] = data
      sessionStorage.setItem(AUTH_CONSTANTS.GUARD_DATA_KEY, JSON.stringify(guardData))

      if (import.meta.env.DEV) {
        console.log('🛡️ Сохраняем guard data:', key, data)
      }
    } catch (error) {
      console.error('Error saving guard data:', error)
    }
  },

  get: (key: string): any => {
    try {
      const guardData = guardDataStorage.getAll()
      return guardData[key] || null
    } catch (error) {
      console.error('Error getting guard data:', error)
      return null
    }
  },

  getAll: (): Record<string, any> => {
    try {
      const data = sessionStorage.getItem(AUTH_CONSTANTS.GUARD_DATA_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error parsing guard data:', error)
      return {}
    }
  },

  remove: (key: string): void => {
    try {
      const guardData = guardDataStorage.getAll()
      delete guardData[key]
      sessionStorage.setItem(AUTH_CONSTANTS.GUARD_DATA_KEY, JSON.stringify(guardData))

      if (import.meta.env.DEV) {
        console.log('🗑️ Удаляем guard data:', key)
      }
    } catch (error) {
      console.error('Error removing guard data:', error)
    }
  },

  clear: (): void => {
    sessionStorage.removeItem(AUTH_CONSTANTS.GUARD_DATA_KEY)
    if (import.meta.env.DEV) {
      console.log('🧹 Очищаем все guard data')
    }
  }
}

export const createFullUrl = (pathname: string, search: string = ''): string => {
  return pathname + search
}

export const isAuthPage = (
  url: string,
  authPages: string[] = [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES]
): boolean => {
  const isAuth = authPages.some(page => url.startsWith(page))

  if (import.meta.env.DEV) {
    console.log(`🔍 Проверяем isAuthPage для "${url}":`, isAuth)
  }

  return isAuth
}

export const determineRedirectUrl = (
  defaultUrl: string,
  callbackUrl?: string | null,
  authPages: string[] = [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES]
): string => {
  if (callbackUrl && !isAuthPage(callbackUrl, authPages)) {
    if (import.meta.env.DEV) {
      console.log('↩️ Используем callbackUrl:', callbackUrl)
    }
    return callbackUrl
  }

  if (import.meta.env.DEV) {
    console.log('🏠 Используем defaultUrl:', defaultUrl)
  }
  return defaultUrl
}
