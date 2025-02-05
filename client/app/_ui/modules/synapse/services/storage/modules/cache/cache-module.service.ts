// Типы для кэширования
export interface CacheMetadata {
  createdAt: number
  updatedAt: number
  expiresAt: number
  accessCount: number
}

export interface CacheOptions {
  // Время жизни кэша
  ttl?: number
  // Настройки очистки
  cleanup?: {
    // Автоматическая очистка устаревших данных
    enabled: boolean
    // Интервал очистки
    interval?: number
  }
  invalidateOnError?: boolean
}

export interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata
}

// Простой утилитный класс для работы с метаданными кэша
export class CacheUtils {
  static createMetadata(ttl: number = 0): CacheMetadata {
    return {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0,
    }
  }

  static isExpired(metadata: CacheMetadata): boolean {
    return Date.now() > metadata.expiresAt
  }

  static updateMetadata(metadata: CacheMetadata): CacheMetadata {
    return {
      ...metadata,
      updatedAt: Date.now(),
      accessCount: metadata.accessCount + 1,
    }
  }

  // Утилиты для создания ключей
  static createKey(...parts: (string | number)[]): string {
    return parts.join('_')
  }

  static createApiKey(endpoint: string, params?: Record<string, any>): string {
    if (!params) return `api_${endpoint}`
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    return `api_${endpoint}_${sortedParams}`
  }
}
