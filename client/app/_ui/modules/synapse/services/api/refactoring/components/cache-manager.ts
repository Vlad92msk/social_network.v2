import { EventEmitter } from 'events'
import { IStorage } from '../../../storage/storage.interface'
import { StorageKeyType } from '../../../storage/utils/storage-key'
import {
  CacheConfig,
  CacheMetadata,
  EndpointConfig,
  QueryResult,
  RequestDefinition,
  RequestOptions,
} from '../types/api.interface'
import { apiLogger, filterCacheableHeaders } from '../utils/api-helpers'

/**
 * Интерфейс для событий кэш-менеджера
 */
export interface CacheManagerEventMap {
  'hit': {
    endpointName: string;
    key: string;
    timestamp: number;
  };
  'miss': {
    endpointName: string;
    key: string;
    timestamp: number;
  };
  'set': {
    endpointName: string;
    key: string;
    timestamp: number;
  };
  'invalidate': {
    tags: string[];
    removedCount: number;
    timestamp: number;
  };
  'cleanup': {
    removedCount: number;
    timestamp: number;
  };
}

/**
 * Централизованный менеджер кэша для API-запросов
 */
export class CacheManager {
  /** Идентификатор таймера очистки кэша */
  private cleanupInterval: number | undefined

  /** Эмиттер событий */
  private eventEmitter: EventEmitter

  /**
   * Создает новый экземпляр кэш-менеджера
   * @param storage Хранилище для кэша
   * @param cacheOptions Настройки кэширования
   */
  constructor(
    protected storage: IStorage,
    public cacheOptions: CacheConfig | boolean = false,
  ) {
    // Обрабатываем случай, когда опции переданы как boolean
    if (typeof cacheOptions === 'boolean') {
      this.cacheOptions = cacheOptions ? { ttl: 30 * 60 * 1000 } : {}
    } else if (!cacheOptions) {
      this.cacheOptions = {}
    }

    // Инициализируем эмиттер событий
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.setMaxListeners(50)

    // Настраиваем периодическую очистку кэша
    this.setupCleanupInterval()
  }

  /**
   * Настраивает периодическую очистку кэша
   */
  private setupCleanupInterval(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval)
    }

    // Если кэширование включено и есть настройки для очистки
    if (typeof this.cacheOptions === 'object' && this.cacheOptions.ttl) {
      // Очищаем кэш каждые 5 минут или с заданной периодичностью
      const cleanupInterval = 5 * 60 * 1000 // 5 минут

      this.cleanupInterval = window.setInterval(
        () => this.clearExpired(),
        cleanupInterval,
      )
    }
  }

  /**
   * Подписка на события кэша
   * @param event Имя события
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribe<K extends keyof CacheManagerEventMap>(
    event: K,
    listener: (data: CacheManagerEventMap[K]) => void,
  ): () => void {
    this.eventEmitter.on(event as string, listener)
    return () => {
      this.eventEmitter.off(event as string, listener)
    }
  }

  /**
   * Очищает просроченные записи в кэше
   */
  public async clearExpired(): Promise<void> {
    try {
      const keys = await this.storage.keys()
      const apiCacheKeys = keys.filter((key) => typeof key === 'string' && (key.startsWith('api:') || key.startsWith('endpoint:')))

      let clearedCount = 0

      for (const key of apiCacheKeys) {
        const value = await this.storage.get(key)
        if (!value) continue

        const metadata = this.extractMetadata(value)

        if (metadata && this.isExpired(metadata)) {
          await this.storage.delete(key)
          clearedCount++
        }
      }

      if (clearedCount > 0) {
        apiLogger.debug(`Очищено ${clearedCount} просроченных записей из кэша`)

        // Генерируем событие очистки
        this.eventEmitter.emit('cleanup', {
          removedCount: clearedCount,
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      apiLogger.error('Ошибка очистки кэша', error)
    }
  }

  /**
   * Проверяет, истек ли срок действия кэша
   * @param metadata Метаданные кэша
   * @returns true если срок действия истек
   */
  private isExpired(metadata: CacheMetadata): boolean {
    return metadata.expiresAt <= Date.now()
  }

  /**
   * Извлекает метаданные из кэшированного значения
   * @param value Кэшированное значение
   * @returns Метаданные кэша или null
   */
  private extractMetadata(value: any): CacheMetadata | null {
    if (!value || typeof value !== 'object') return null

    // Проверяем разные структуры метаданных
    if ('metadata' in value) {
      return value.metadata
    }

    if ('data' in value && typeof value.data === 'object' && value.data && 'metadata' in value.data) {
      return value.data.metadata
    }

    return null
  }

  /**
   * Останавливает периодическую очистку и освобождает ресурсы
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }

    // Очищаем все обработчики событий
    this.eventEmitter.removeAllListeners()
  }

  /**
   * Проверяет, должен ли запрос быть кэширован
   * @param endpointName Имя эндпоинта
   * @param endpointConfig Конфигурация эндпоинта
   * @param options Опции запроса
   * @returns true если запрос должен кэшироваться
   */
  public shouldCache(
    endpointName: string,
    endpointConfig?: EndpointConfig,
    options?: RequestOptions,
  ): boolean {
    // Если кэширование явно отключено в опциях запроса
    if (options?.disableCache) return false

    // Если кэширование явно включено в опциях запроса
    if (options?.enableCache) return true

    // Если кэширование настроено в эндпоинте
    if (endpointConfig) {
      // Если кэширование явно отключено в конфигурации эндпоинта
      if (endpointConfig.cache === false) return false

      // Если кэширование явно включено в конфигурации эндпоинта
      if (endpointConfig.cache === true) return true

      // Если есть объект конфигурации кэша в эндпоинте
      if (typeof endpointConfig.cache === 'object' && endpointConfig.cache !== null) {
        return true
      }
    }

    // Если глобальное кэширование отключено
    if (this.cacheOptions === false) return false

    // Если глобальное кэширование включено без уточнений
    if (this.cacheOptions === true) return true

    // Проверяем правила кэширования в глобальных настройках
    if (typeof this.cacheOptions === 'object') {
      // Если для эндпоинта есть правило
      if (this.cacheOptions.rules) {
        const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
        if (rule) return true
      }

      // Если указан глобальный TTL
      return !!this.cacheOptions.ttl
    }

    return false
  }

  /**
   * Создает ключ кэша на основе эндпоинта и параметров
   * @param endpointName Имя эндпоинта
   * @param requestDef Определение запроса
   * @param params Параметры запроса
   * @param options Опции запроса
   * @param result Результат запроса
   * @returns Ключ кэша
   */
  protected createCacheKey(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    options?: {
      cacheableHeaderKeys?: string[];
    },
    result?: QueryResult,
  ): [StorageKeyType, Record<string, any>] {
    // Базовые компоненты ключа
    const keyParams: Record<string, any> = {
      method: requestDef.method,
      url: requestDef.path,
      params,
    }

    // Добавляем параметры запроса в ключ, если они есть
    if (requestDef.query && Object.keys(requestDef.query).length > 0) {
      keyParams.query = JSON.stringify(requestDef.query)
    }

    // Получаем эффективные ключи заголовков для кэширования
    const effectiveCacheableKeys = options?.cacheableHeaderKeys || []

    // Добавляем заголовки в ключ, если они есть в результате
    if (result?.metadata?.cacheableHeaders && Object.keys(result.metadata.cacheableHeaders).length > 0) {
      keyParams.headers = JSON.stringify(result.metadata.cacheableHeaders)
    }
    // Если нет заголовков в результате, но есть заголовки в запросе
    else if (effectiveCacheableKeys.length > 0 && result?.metadata?.requestHeaders) {
      const filteredHeaders = filterCacheableHeaders(
        result.metadata.requestHeaders,
        effectiveCacheableKeys,
      )

      if (Object.keys(filteredHeaders).length > 0) {
        keyParams.headers = JSON.stringify(filteredHeaders)
      }
    }

    // Очищаем пустые значения
    Object.keys(keyParams).forEach((key) => {
      if (keyParams[key] === undefined || keyParams[key] === null || keyParams[key] === '') {
        delete keyParams[key]
      }
    })

    // Формируем ключ для хранилища
    return [`api:${endpointName}`, keyParams]
  }

  /**
   * Получает запись из кэша
   * @param endpointName Имя эндпоинта
   * @param requestDef Определение запроса
   * @param params Параметры запроса
   * @param options Опции запроса
   * @returns Кэшированный результат или null
   */
  public async get<T, E = Error>(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    options?: {
      cacheableHeaderKeys?: string[];
    },
  ): Promise<QueryResult<T, E> | null> {
    try {
      // Создаем ключ кэша
      const [cacheKey, keyParams] = this.createCacheKey(
        endpointName,
        requestDef,
        params,
        options,
      )

      // Получаем данные из хранилища
      const cached = await this.storage.get<any>(cacheKey)

      if (!cached) {
        // Генерируем событие промаха кэша
        this.eventEmitter.emit('miss', {
          endpointName,
          key: String(cacheKey),
          timestamp: Date.now(),
        })

        return null
      }

      // Проверяем, не истек ли срок действия кэша
      const metadata = this.extractMetadata(cached)
      if (metadata) {
        if (this.isExpired(metadata)) {
          await this.storage.delete(cacheKey)

          // Генерируем событие промаха кэша
          this.eventEmitter.emit('miss', {
            endpointName,
            key: String(cacheKey),
            timestamp: Date.now(),
          })

          return null
        }

        // Генерируем событие попадания в кэш
        this.eventEmitter.emit('hit', {
          endpointName,
          key: String(cacheKey),
          timestamp: Date.now(),
        })
      }

      // Возвращаем данные из кэша с учетом разных форматов хранения
      if ('data' in cached && cached.data) {
        // Если данные хранятся в формате {data: QueryResult}
        if (typeof cached.data === 'object' && 'ok' in cached.data) {
          return cached.data as QueryResult<T, E>
        }
      }

      // Если данные хранятся в формате QueryResult
      if ('ok' in cached) {
        return cached as QueryResult<T, E>
      }

      // Если формат не подходит, возвращаем null
      return null
    } catch (error) {
      apiLogger.error('Ошибка чтения из кэша', error)
      return null
    }
  }

  /**
   * Сохраняет запись в кэш
   * @param endpointName Имя эндпоинта
   * @param requestDef Определение запроса
   * @param params Параметры запроса
   * @param result Результат запроса
   * @param options Опции запроса и настройки кэша
   */
  public async set<T, E = Error>(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    result: QueryResult<T, E>,
    options?: {
      cacheableHeaderKeys?: string[];
      endpointConfig?: EndpointConfig;
    },
  ): Promise<void> {
    try {
      // Создаем ключ кэша
      const [key, keyParams] = this.createCacheKey(
        endpointName,
        requestDef,
        params,
        options,
        result,
      )

      // Получаем теги для эндпоинта
      const tags = options?.endpointConfig?.tags || []

      // Получаем TTL для кэша
      const ttl = this.getCacheTTL(endpointName, options?.endpointConfig)

      // Формируем метаданные кэша
      const now = Date.now()
      const metadata: CacheMetadata = {
        createdAt: now,
        updatedAt: now,
        expiresAt: now + ttl,
        accessCount: 0,
        tags,
        createdAtDateTime: new Date(now).toISOString(),
        updatedAtDateTime: new Date(now).toISOString(),
        expiresAtDateTime: new Date(now + ttl).toISOString(),
      }

      // Создаем объект для кэширования
      const cacheableData = {
        data: result,
        keyParams,
        metadata,
      }

      // Сохраняем в хранилище
      await this.storage.set(key, cacheableData)

      // Генерируем событие установки в кэш
      this.eventEmitter.emit('set', {
        endpointName,
        key: String(key),
        timestamp: now,
      })

      // Инвалидируем теги, если указаны в эндпоинте
      if (options?.endpointConfig?.invalidatesTags?.length) {
        await this.invalidateByTags(options.endpointConfig.invalidatesTags)
      }
    } catch (error) {
      apiLogger.error('Ошибка записи в кэш', error)
    }
  }

  /**
   * Получает TTL для эндпоинта
   * @param endpointName Имя эндпоинта
   * @param endpointConfig Конфигурация эндпоинта
   * @returns TTL в миллисекундах
   */
  public getCacheTTL(endpointName: string, endpointConfig?: EndpointConfig): number {
    // Проверяем TTL в конфигурации эндпоинта
    if (endpointConfig && typeof endpointConfig.cache === 'object' && endpointConfig.cache !== null) {
      if (endpointConfig.cache.ttl) {
        return endpointConfig.cache.ttl
      }
    }

    // Проверяем глобальные правила кэширования
    if (typeof this.cacheOptions === 'object' && this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && typeof rule.ttl === 'number') {
        return rule.ttl
      }
    }

    // Используем глобальный TTL или значение по умолчанию
    if (typeof this.cacheOptions === 'object' && this.cacheOptions.ttl) {
      return this.cacheOptions.ttl
    }

    // Значение по умолчанию - 30 минут
    return 30 * 60 * 1000
  }

  /**
   * Инвалидирует кэш по тегам
   * @param tags Массив тегов для инвалидации
   */
  public async invalidateByTags(tags: string[]): Promise<void> {
    if (!tags.length) return

    try {
      const keys = await this.storage.keys()
      const apiCacheKeys = keys.filter((key) => typeof key === 'string' && key.startsWith('api:'))

      let invalidatedCount = 0

      for (const key of apiCacheKeys) {
        const value = await this.storage.get(key)
        if (!value) continue

        const metadata = this.extractMetadata(value)

        // Проверяем наличие пересечения тегов
        if (metadata && metadata.tags && Array.isArray(metadata.tags)) {
          const hasMatchingTag = metadata.tags.some((tag) => tags.includes(tag))
          if (hasMatchingTag) {
            await this.storage.delete(key)
            invalidatedCount++
          }
        }
      }

      if (invalidatedCount > 0) {
        apiLogger.debug(`Инвалидировано ${invalidatedCount} записей по тегам: ${tags.join(', ')}`)

        // Генерируем событие инвалидации кэша
        this.eventEmitter.emit('invalidate', {
          tags,
          removedCount: invalidatedCount,
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      apiLogger.error('Ошибка инвалидации кэша', error)
    }
  }

  /**
   * Полностью очищает кэш
   */
  public async clearAll(): Promise<void> {
    try {
      const keys = await this.storage.keys()
      const apiCacheKeys = keys.filter((key) => typeof key === 'string' && (
        key.startsWith('api:')
          || key.startsWith('endpoint:')
      ))

      for (const key of apiCacheKeys) {
        await this.storage.delete(key)
      }

      apiLogger.debug(`Очищен весь кэш API (${apiCacheKeys.length} записей)`)

      // Генерируем событие очистки
      this.eventEmitter.emit('cleanup', {
        removedCount: apiCacheKeys.length,
        timestamp: Date.now(),
      })
    } catch (error) {
      apiLogger.error('Ошибка полной очистки кэша', error)
    }
  }
}
