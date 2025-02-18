import { QueryResult, RequestDefinition } from './query.interface'
import { IStorage } from '../../storage.interface'
import { StorageKeyType } from '../../utils/storage-key'
import { CacheUtils } from '../cache/cache-module.service'

/**
 * Управляет кэшированием запросов
 */
export class QueryCacheManager {
  constructor(
    private storage: IStorage,
    public cacheOptions?: {
      ttl?: number
      invalidateOnError?: boolean
      tags?: Record<string, string[]>
    },
  ) {}

  /**
   * Проверяет, должен ли запрос быть кэширован
   */
  public shouldCache(endpointName: string): boolean {
    // Если нет опций кэширования, возвращаем false
    if (!this.cacheOptions) return false

    // Если для эндпоинта указаны теги, то кэшируем
    if (this.cacheOptions.tags?.[endpointName]) return true

    // Если указан глобальный TTL, то кэшируем
    return !!this.cacheOptions.ttl
  }

  /**
   * Создает ключ кэша для запроса
   */
  public createCacheKey(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
  ): [StorageKeyType, Record<string, any> | undefined] {
    // Создаем параметры ключа
    const keyParams: Record<string, any> = {
      url: `${requestDef.path}`,
      query: requestDef.query ? JSON.stringify(requestDef.query) : '',
      method: requestDef.method,
      body: requestDef.body ? JSON.stringify(requestDef.body) : '',
      params: params ? JSON.stringify(params) : '',
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
   * Получает данные из кэша
   */
  public async get<T, E>(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
  ): Promise<QueryResult<T, E> | null> {
    try {
      const [cacheKey] = this.createCacheKey(endpointName, requestDef, params)
      const cached = await this.storage.get<QueryResult<T, E>>(cacheKey)

      if (!cached) return null

      // Проверяем, не истек ли срок действия кэша
      if (cached.metadata) {
        const isExpired = CacheUtils.isExpired(cached.metadata)
        if (isExpired) {
          await this.storage.delete(cacheKey)
          return null
        }
      }

      //@ts-ignore
      return cached.data || cached
    } catch (error) {
      console.error('Cache read error:', error)
      return null
    }
  }

  /**
   * Сохраняет данные в кэш
   */
  public async set<T, E>(
    endpointName: string,
    requestDef: RequestDefinition,
    params: any,
    result: QueryResult<T, E>,
  ): Promise<void> {
    try {
      const [cacheKey, keyParams] = this.createCacheKey(endpointName, requestDef, params)

      // Получаем теги для эндпоинта
      const tags = this.cacheOptions?.tags?.[endpointName] || []

      // Получаем TTL
      const ttl = this.cacheOptions?.ttl || 0

      // Создаем объект для кэширования
      const cacheableData = {
        data: result,
        keyParams,
        metadata: CacheUtils.createMetadata(ttl, tags),
      }

      await this.storage.set(cacheKey, cacheableData)
    } catch (error) {
      console.error('Cache write error:', error)
    }
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

        // @ts-ignore
        if (value?.metadata?.tags
        // @ts-ignore
            && CacheUtils.hasAnyTag(value.metadata, tags)) {
          await this.storage.delete(key)
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }
}
