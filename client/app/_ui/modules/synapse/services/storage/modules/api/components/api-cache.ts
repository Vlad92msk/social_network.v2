import { IStorage } from '../../../storage.interface'
import { StorageKeyType } from '../../../utils/storage-key'
import { CacheUtils } from '../../cache/cache-module.service'
import { CacheConfig, CacheMetadata, QueryResult, RequestDefinition } from '../types/api.interface'

/**
 * Управляет кэшированием запросов
 */
export class ApiCache {
  private cleanupInterval: number | undefined

  constructor(
    protected storage: IStorage,
    public cacheOptions: CacheConfig & {
      cacheableHeaderKeys?: string[],
      tags?: Record<string, string[]>,
      cleanup?: {
        enabled: boolean,
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
   * Очищает просроченные записи в кэше
   */
  public async clearExpired(): Promise<void> {
    try {
      const keys = await this.storage.keys()

      for (const key of keys) {
        const value = await this.storage.get(key)

        // Проверяем наличие метаданных с временем истечения
        // @ts-ignore
        const metadata: CacheMetadata = value && typeof value === 'object' && 'metadata' in value
          ? value.metadata
          : (value && typeof value === 'object' && 'data' in value
              && typeof value.data === 'object' && value.data && 'metadata' in value.data
            ? value.data.metadata : null)

        if (metadata && CacheUtils.isExpired(metadata)) {
          await this.storage.delete(key)
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
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
   */
  public shouldCache(endpointName: string): boolean {
    // Если нет опций кэширования, возвращаем false
    if (!this.cacheOptions) return false

    // Если для эндпоинта указаны теги, то кэшируем
    const cacheTags = this.cacheOptions.tags as Record<string, string[]> | undefined
    if (cacheTags && cacheTags[endpointName]) return true

    // Если указан глобальный TTL, то кэшируем
    return !!this.cacheOptions.ttl
  }

  /**
   * Генерирует ключ кэша на основе эндпоинта и параметров
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
      const metadata = cached && typeof cached === 'object' ? cached.metadata : null
      if (metadata) {
        const isExpired = CacheUtils.isExpired(metadata as any)
        if (isExpired) {
          await this.storage.delete(cacheKey)
          return null
        }
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
      console.error('Cache read error:', error)
      return null
    }
  }

  /**
   * Сохраняет запись в кэш
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

      const metadata: CacheMetadata = {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + ttl,
        accessCount: 0,
        tags,
        createdAtDateTime: new Date().toISOString(),
        updatedAtDateTime: new Date().toISOString(),
        expiresAtDateTime: new Date(Date.now() + ttl).toISOString(),
      }

      // Создаем объект для кэширования
      const cacheableData = {
        data: result,
        keyParams,
        metadata,
      }

      await this.storage.set(key, cacheableData)
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  /**
   * Получает TTL для эндпоинта
   */
  public getCacheTTL(endpointName: string): number {
    // Проверяем наличие специфичного TTL в правилах
    if (this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && rule.ttl) {
        return rule.ttl
      }
    }

    // Возвращаем глобальный TTL или 0
    return this.cacheOptions.ttl || 0
  }

  /**
   * Получает теги для эндпоинта
   */
  public getTagsForEndpoint(endpointName: string): string[] {
    // Получаем теги из правил
    if (this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && rule.tags) {
        return rule.tags
      }
    }

    // Получаем теги из опций
    const cacheTags = this.cacheOptions.tags
    if (cacheTags && cacheTags[endpointName]) {
      return cacheTags[endpointName]
    }

    return []
  }

  /**
   * Инвалидирует кэш по тегам
   */
  public async invalidateByTags(tags: string[]): Promise<void> {
    if (!tags.length) return

    try {
      const keys = await this.storage.keys()

      for (const key of keys) {
        const value = await this.storage.get(key)

        // Проверяем наличие тегов в метаданных
        const metadata = value && typeof value === 'object' && 'metadata' in value
          ? value.metadata
          : (value && typeof value === 'object' && 'data' in value
                        && typeof value.data === 'object' && value.data && 'metadata' in value.data
            ? value.data.metadata : null)

        // Проверяем наличие пересечения тегов
        //@ts-ignore
        if (metadata && metadata.tags && Array.isArray(metadata.tags)) {
          //@ts-ignore
          const hasMatchingTag = metadata.tags.some((tag: string) => tags.includes(tag))
          if (hasMatchingTag) {
            await this.storage.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }
}
