import { EventEmitter } from 'events'
import { CacheUtils } from '../../storage/modules/cache/cache-module.service'
import { IStorage } from '../../storage/storage.interface'
import { StorageKeyType } from '../../storage/utils/storage-key'
import { CacheConfig, CacheMetadata, QueryResult, RequestDefinition, Unsubscribe } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'

/**
 * Типы событий для ApiCache
 */
export interface ApiCacheEventMap {
  'cache:hit': {
    endpointName: string
    key: string
    timestamp: number
  }
  'cache:miss': {
    endpointName: string
    key: string
    timestamp: number
  }
  'cache:set': {
    endpointName: string
    key: string
    timestamp: number
  }
  'cache:invalidate': {
    tags: string[]
    timestamp: number
  }
  'cache:cleanup': {
    removedCount: number
    timestamp: number
  }
}

/**
 * Улучшенный класс для управления кэшированием API-запросов с системой событий
 */
export class ApiCache {
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
    public cacheOptions: (CacheConfig & {
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
    }) | boolean = false,
  ) {
    // Обрабатываем случай, когда опции переданы как boolean
    if (typeof cacheOptions === 'boolean') {
      this.cacheOptions = cacheOptions ? { ttl: 30 * 60 * 1000, tags: {} } : {}
    } else if (!cacheOptions) {
      this.cacheOptions = {}
    }

    // Инициализируем периодическую очистку кэша если нужно
    if (typeof this.cacheOptions === 'object' && this.cacheOptions?.cleanup?.enabled && this.cacheOptions.cleanup.interval) {
      this.setupCleanupInterval()
    }

    // Инициализируем эмиттер событий
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.setMaxListeners(50)
  }

  /**
   * Подписка на события кэша
   * @param event Имя события
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribe<K extends keyof ApiCacheEventMap>(
    event: K,
    listener: (data: ApiCacheEventMap[K]) => void,
  ): Unsubscribe {
    this.eventEmitter.on(event as string, listener)
    return () => {
      this.eventEmitter.off(event as string, listener)
    }
  }

  /**
   * Настраивает периодическую очистку кэша
   */
  private setupCleanupInterval(): void {
    if (this.cleanupInterval) {
      window.clearInterval(this.cleanupInterval)
    }

    if (typeof this.cacheOptions === 'object' && this.cacheOptions?.cleanup?.enabled && this.cacheOptions.cleanup.interval) {
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

    // Если текущие опции - boolean или не заданы
    if (typeof this.cacheOptions !== 'object') {
      // Преобразуем в объект
      this.cacheOptions = this.cacheOptions === true ? { ttl: 30 * 60 * 1000 } : {}
    }

    // Теперь this.cacheOptions точно объект
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

        // Генерируем событие очистки
        this.eventEmitter.emit('cache:cleanup', {
          removedCount: clearedCount,
          timestamp: Date.now(),
        })
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
   * @returns true если запрос должен кэшироваться
   */
  public shouldCache(endpointName: string): boolean {
    // Если нет опций кэширования или явно отключено, возвращаем false
    if (this.cacheOptions === undefined || this.cacheOptions === false) return false

    // Если кэширование явно включено через boolean
    if (this.cacheOptions === true) return true

    // Если для эндпоинта указаны теги, то кэшируем
    if (typeof this.cacheOptions === 'object') {
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

    return false
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
    options?: { cacheableHeaderKeys?: string[] }
  ): [StorageKeyType, Record<string, any> | undefined] {
    console.log('createCacheKey called with:', {
      endpointName,
      requestDef,
      result: result?.metadata,
      options
    });
    // Создаем параметры ключа
    const keyParams: Record<string, any> = {
      method: requestDef.method,
      url: `${requestDef.path}`,
      query: requestDef.query ? JSON.stringify(requestDef.query) : '',
      params: params,
    }

    // Если есть заголовки в метаданных результата
    if (result?.metadata?.cacheableHeaders) {
      const { cacheableHeaders } = result.metadata;
      console.log('cacheableHeaders from metadata:', cacheableHeaders);
      if (Object.keys(cacheableHeaders).length > 0) {
        keyParams.headers = JSON.stringify(cacheableHeaders);
        console.log('Added headers to keyParams:', keyParams.headers);
      } else {
        console.log('No cacheableHeaders found in metadata or empty object');
      }
    }

    // Добавляем определенные заголовки в ключ кеша, если нет заголовков из метаданных
    if (!keyParams.headers && options?.cacheableHeaderKeys?.length) {
      // Получаем заголовки из исходного запроса (headers в request.metadata), если они есть
      if (result?.metadata?.requestHeaders) {
        const { requestHeaders } = result.metadata;
        // Преобразуем ключи cachableHeaderKeys в нижний регистр для регистронезависимого сравнения
        const lowerCaseKeys = options.cacheableHeaderKeys.map(key => key.toLowerCase());

        // Фильтруем только нужные заголовки
        const filteredHeaders = Object.entries(requestHeaders)
          .filter(([key]) => lowerCaseKeys.includes(key.toLowerCase()))
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {} as Record<string, string>);

        if (Object.keys(filteredHeaders).length > 0) {
          keyParams.headers = JSON.stringify(filteredHeaders);
          console.log('Added filtered headers to keyParams:', keyParams.headers);
        } else {
          // Если не удалось найти заголовки, сохраняем просто ключи для согласованности
          keyParams.headerKeys = JSON.stringify(options.cacheableHeaderKeys);
          console.log('No matching headers found, using headerKeys');
        }
      } else {
        // Если нет заголовков, используем только ключи
        keyParams.headerKeys = JSON.stringify(options.cacheableHeaderKeys);
        console.log('No request headers available, using headerKeys');
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
      console.log('Creating cache key with result:', result?.metadata?.cacheableHeaders);

      // Если есть результат запроса, используем его для создания ключа
      // В противном случае, создаем "заглушку" с cacheableHeaders из options
      let keyResult = result

      // Если options содержит cacheableHeaderKeys, но нет result или нет cacheableHeaders в метаданных
      if (options?.cacheableHeaderKeys?.length) {
        console.log('GET: Using cacheableHeaderKeys from options:', options.cacheableHeaderKeys);

        // Создаем новый объект для результата с метаданными
        keyResult = {
          ...result,
          metadata: {
            ...(result?.metadata || {}),
            cacheableHeaderKeys: options.cacheableHeaderKeys,
            // Добавляем пустой объект cacheableHeaders, если его нет
            cacheableHeaders: result?.metadata?.cacheableHeaders || {},
            // Если есть requestHeaders, сохраняем их для фильтрации в createCacheKey
            requestHeaders: result?.metadata?.requestHeaders || {}
          },
        } as QueryResult<T, E>
      }

      const [cacheKey] = this.createCacheKey(endpointName, requestDef, params, keyResult)

      const cached = await this.storage.get<any>(cacheKey)

      if (!cached) {
        // Генерируем событие промаха кэша
        this.eventEmitter.emit('cache:miss', {
          endpointName,
          key: String(cacheKey),
          timestamp: Date.now(),
        })

        return null
      }

      // Проверяем, не истек ли срок действия кэша
      const metadata = this.extractMetadata(cached)
      if (metadata) {
        const isExpired = CacheUtils.isExpired(metadata)
        if (isExpired) {
          await this.storage.delete(cacheKey)

          // Генерируем событие промаха кэша
          this.eventEmitter.emit('cache:miss', {
            endpointName,
            key: String(cacheKey),
            timestamp: Date.now(),
          })

          return null
        }

        // Генерируем событие попадания в кэш
        this.eventEmitter.emit('cache:hit', {
          endpointName,
          key: String(cacheKey),
          timestamp: Date.now(),
        })
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
    options?: { cacheableHeaderKeys?: string[] },
  ): Promise<void> {
    try {
      console.log('SET: result.metadata:', result.metadata);
      const [key, keyParams] = this.createCacheKey(endpointName, requestDef, params, result, options)

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

      // Генерируем событие установки в кэш
      this.eventEmitter.emit('cache:set', {
        endpointName,
        key: String(key),
        timestamp: now,
      })
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
    // Если кэширование отключено или опции не заданы
    if (this.cacheOptions === undefined || this.cacheOptions === false) {
      return 0
    }

    // Если кэширование явно включено, но без дополнительных настроек
    if (this.cacheOptions === true) {
      return 30 * 60 * 1000 // 30 минут по умолчанию
    }

    // Проверяем наличие специфичного TTL в правилах
    if (typeof this.cacheOptions === 'object' && this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && typeof rule.ttl === 'number') {
        return rule.ttl
      }
    }

    // Возвращаем глобальный TTL или значение по умолчанию (30 минут)
    return typeof this.cacheOptions === 'object' && this.cacheOptions.ttl ? this.cacheOptions.ttl : 30 * 60 * 1000
  }

  /**
   * Получает теги для эндпоинта
   * @param endpointName Имя эндпоинта
   * @returns Массив тегов
   */
  public getTagsForEndpoint(endpointName: string): string[] {
    // Если кэширование отключено или опции не заданы
    if (this.cacheOptions === undefined || this.cacheOptions === false) {
      return []
    }

    // Если кэширование включено без дополнительных настроек
    if (this.cacheOptions === true) {
      return ['default']
    }

    // Получаем теги из правил
    if (typeof this.cacheOptions === 'object' && this.cacheOptions.rules) {
      const rule = this.cacheOptions.rules.find((r) => r.method === endpointName)
      if (rule && rule.tags) {
        return [...rule.tags]
      }
    }

    // Получаем теги из опций
    if (typeof this.cacheOptions === 'object' && this.cacheOptions.tags) {
      const cacheTags = this.cacheOptions.tags
      if (cacheTags && cacheTags[endpointName]) {
        return [...cacheTags[endpointName]]
      }
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

        // Генерируем событие инвалидации кэша
        this.eventEmitter.emit('cache:invalidate', {
          tags,
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
      this.eventEmitter.emit('cache:cleanup', {
        removedCount: apiCacheKeys.length,
        timestamp: Date.now(),
      })
    } catch (error) {
      apiLogger.error('Ошибка полной очистки кэша', error)
    }
  }
}
