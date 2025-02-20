/**
 * Управляет кэшированием запросов API
 */
import { CacheUtils } from '../../storage/modules/cache/cache-module.service'
import { IStorage } from '../../storage/storage.interface'
import { StorageKeyType } from '../../storage/utils/storage-key'
import { CacheConfig, CacheMetadata, QueryResult, RequestDefinition } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'

/**
 * Класс для управления кэшированием API-запросов
 */
export class ApiCache {
  /** Идентификатор таймера очистки кэша */
  private cleanupInterval: number | undefined

  /**
   * Создает новый экземпляр кэш-менеджера
   * @param storage Хранилище для кэша
   * @param cacheOptions Настройки кэширования
   */
  constructor(
    protected storage: IStorage,
    public cacheOptions: CacheConfig & {
      /** Ключи заголовков, которые влияют на кэш */
      cacheableHeaderKeys?: string[],
      /** Теги для группировки кэша */
      tags?: Record<string, string[]>,
      /** Настройки периодической очистки */
      cleanup?: {
        /** Включена ли очистка */
        enabled: boolean,
        /** Интервал очистки в миллисекундах */
        interval?: number
      }
    } = {},
  ) {
    // Инициализируем периодическую очистку кэша если нужно
    if (cacheOptions.cleanup?.enabled && cacheOptions.cleanup.interval) {
      this.setupCleanupInterval()
    }
  }

  /**
   * Настраивает периодическую очистку кэша
   */
  private setupCleanupInterval(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval)
    }

    if (this.cacheOptions.cleanup?.enabled && this.cacheOptions.cleanup.interval) {
      this.cleanupInterval = window.setInterval(
        () => this.clearExpired(),
        this.cacheOptions.cleanup.interval,
      )
    }
  }

  /**
   * Регистрирует теги для эндпоинта
   * @param endpointName Имя эндпоинта
   * @param tags Массив тегов
   */
  public registerTags(endpointName: string, tags: string[]): void {
    if (!tags.length) return

    this.cacheOptions = this.cacheOptions || {}
    this.cacheOptions.tags = this.cacheOptions.tags || {}
    this.cacheOptions.tags[endpointName] = tags
  }

  /**
   * Очищает просроченные записи в кэше
   */
  public async clearExpired(): Promise<void> {
    try {
      const keys = await this.storage.keys()
      let clearedCount = 0

      for (const key of keys) {
        const value = await this.storage.get(key)
        const metadata = this.extractMetadata(value)

        if (metadata && CacheUtils.isExpired(metadata)) {
          await this.storage.delete(key)
          clearedCount++
        }
      }

      if (clearedCount > 0) {
        apiLogger.debug(`Очищено ${clearedCount} просроченных записей из кэша`)
      }
    } catch (error) {
      apiLogger.error('Ошибка очистки кэша', error)
    }
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
  public dispose(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }

  /**
   * Проверяет, должен ли запрос быть кэширован
   * @param endpointName Имя эндпоинта
   * @returns true если запрос должен кэшироваться
   */
  public shouldCache(endpointName: string): boolean {
    // Если нет опций кэширования, возвращаем false
    if (!this.cacheOptions) return false

    // Если для эндпоинта указаны теги, то кэшируем
    const cacheTags = this.cacheOptions.tags as Record<string, string[]> | undefined
    if (cacheTags && cacheTags[endpointName] && cacheTags[endpointName].length > 0) return true

    // Проверяем наличие специфичного TTL в правилах
    if (this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && rule.ttl) {
        return true
      }
    }

    // Если указан глобальный TTL, то кэшируем
    return !!this.cacheOptions.ttl
  }

  /**
   * Генерирует ключ кэша на основе эндпоинта и параметров
   * @param endpointName Имя эндпоинта
   * @param requestDef Определение запроса
   * @param params Параметры запроса
   * @param result Результат запроса
   * @returns Ключ кэша и параметры ключа
   */
  protected createCacheKey(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    result?: QueryResult,
  ): [StorageKeyType, Record<string, any> | undefined] {
    // Создаем параметры ключа (без тела запроса - для кэша оно не нужно)
    const keyParams: Record<string, any> = {
      method: requestDef.method,
      url: `${requestDef.path}`,
      query: requestDef.query ? JSON.stringify(requestDef.query) : '',
      params: params ? JSON.stringify(params) : '',
    }

    // Добавляем кэшируемые заголовки в ключ, если они есть
    if (result?.metadata?.cacheableHeaders) {
      const { cacheableHeaders } = result.metadata
      if (Object.keys(cacheableHeaders).length > 0) {
        keyParams.headers = JSON.stringify(cacheableHeaders)
      }
    }

    // Очищаем пустые значения
    Object.keys(keyParams).forEach((key) => {
      if (keyParams[key] === undefined || keyParams[key] === null || keyParams[key] === '') {
        delete keyParams[key]
      }
    })

    return CacheUtils.createApiKey(endpointName, keyParams)
  }

  /**
   * Получает запись из кэша
   * @param endpointName Имя эндпоинта
   * @param requestDef Определение запроса
   * @param params Параметры запроса
   * @param options Дополнительные опции
   * @param result Результат запроса (для ключей кэша)
   * @returns Кэшированный результат или null
   */
  public async get<T, E extends Error = Error>(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    options?: { cacheableHeaderKeys?: string[] },
    result?: QueryResult<T, E>,
  ): Promise<QueryResult<T, E> | null> {
    try {
      const [cacheKey] = this.createCacheKey(endpointName, requestDef, params, result)
      const cached = await this.storage.get<any>(cacheKey)

      if (!cached) return null

      // Проверяем, не истек ли срок действия кэша
      const metadata = this.extractMetadata(cached)
      if (metadata) {
        const isExpired = CacheUtils.isExpired(metadata)
        if (isExpired) {
          await this.storage.delete(cacheKey)
          return null
        }

        // Увеличиваем счетчик обращений
        await this.updateAccessCount(cacheKey, metadata)
      }

      // Возвращаем данные из кэша с учетом разных форматов хранения
      if ('data' in cached && cached.data) {
        if (typeof cached.data === 'object' && 'ok' in cached.data) {
          return cached.data as QueryResult<T, E>
        }
      }

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
   * Обновляет счетчик доступа к кэшу
   * @param cacheKey Ключ кэша
   * @param metadata Метаданные кэша
   */
  private async updateAccessCount(cacheKey: StorageKeyType, metadata: CacheMetadata): Promise<void> {
    try {
      const updatedMetadata = {
        ...metadata,
        accessCount: (metadata.accessCount || 0) + 1,
        updatedAt: Date.now(),
        updatedAtDateTime: new Date().toISOString(),
      }

      const cached = await this.storage.get(cacheKey)
      if (cached && typeof cached === 'object') {
        if ('metadata' in cached) {
          await this.storage.set(cacheKey, {
            ...cached,
            metadata: updatedMetadata,
          })
        } else if ('data' in cached && cached.data && typeof cached.data === 'object' && 'metadata' in cached.data) {
          const updatedData = {
            ...cached.data,
            metadata: updatedMetadata,
          }
          await this.storage.set(cacheKey, {
            ...cached,
            data: updatedData,
          })
        }
      }
    } catch (error) {
      // Ошибка обновления счетчика не должна прерывать основной поток
      apiLogger.debug('Ошибка обновления счетчика доступа к кэшу', error)
    }
  }

  /**
   * Сохраняет запись в кэш
   * @param endpointName Имя эндпоинта
   * @param requestDef Определение запроса
   * @param params Параметры запроса
   * @param result Результат запроса
   */
  public async set<T, E extends Error = Error>(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    result: QueryResult<T, E>,
  ): Promise<void> {
    try {
      const [key, keyParams] = this.createCacheKey(endpointName, requestDef, params, result)

      // Получаем теги для эндпоинта
      const tags = this.getTagsForEndpoint(endpointName)

      // Получаем TTL
      const ttl = this.getCacheTTL(endpointName)

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

      await this.storage.set(key, cacheableData)
    } catch (error) {
      apiLogger.error('Ошибка записи в кэш', error)
    }
  }

  /**
   * Получает TTL для эндпоинта
   * @param endpointName Имя эндпоинта
   * @returns TTL в миллисекундах
   */
  public getCacheTTL(endpointName: string): number {
    // Проверяем наличие специфичного TTL в правилах
    if (this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && typeof rule.ttl === 'number') {
        return rule.ttl
      }
    }

    // Возвращаем глобальный TTL или значение по умолчанию (30 минут)
    return this.cacheOptions.ttl || 30 * 60 * 1000
  }

  /**
   * Получает теги для эндпоинта
   * @param endpointName Имя эндпоинта
   * @returns Массив тегов
   */
  public getTagsForEndpoint(endpointName: string): string[] {
    // Получаем теги из правил
    if (this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && rule.tags) {
        return [...rule.tags]
      }
    }

    // Получаем теги из опций
    const cacheTags = this.cacheOptions.tags
    if (cacheTags && cacheTags[endpointName]) {
      return [...cacheTags[endpointName]]
    }

    return []
  }

  /**
   * Инвалидирует кэш по тегам
   * @param tags Массив тегов для инвалидации
   */
  public async invalidateByTags(tags: string[]): Promise<void> {
    if (!tags.length) return

    try {
      const keys = await this.storage.keys()
      let invalidatedCount = 0

      for (const key of keys) {
        const value = await this.storage.get(key)
        const metadata = this.extractMetadata(value)

        // Проверяем наличие пересечения тегов
        if (metadata && metadata.tags && Array.isArray(metadata.tags)) {
          const hasMatchingTag = metadata.tags.some((tag: string) => tags.includes(tag))
          if (hasMatchingTag) {
            await this.storage.delete(key)
            invalidatedCount++
          }
        }
      }

      if (invalidatedCount > 0) {
        apiLogger.debug(`Инвалидировано ${invalidatedCount} записей по тегам: ${tags.join(', ')}`)
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
    } catch (error) {
      apiLogger.error('Ошибка полной очистки кэша', error)
    }
  }
}
