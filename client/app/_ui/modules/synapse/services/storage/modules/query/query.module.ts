import { fetchBaseQuery } from './fetch-base-query'
import { QueryCacheManager } from './query-cache.manager'
import {
  BaseQueryFn,
  CacheConfig,
  Endpoint,
  EndpointConfig,
  EndpointState,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  QueryModuleOptions,
  RequestOptions,
  Unsubscribe,
} from './query.interface'
import { IndexedDBStorage } from '../../adapters/indexed-DB.service'
import { LocalStorage } from '../../adapters/local-storage.service'
import { MemoryStorage } from '../../adapters/memory-storage.service'
import { IStorage } from '../../storage.interface'
import { createCacheMiddleware } from '../cache/create-cache.middleware'

/**
 * Модуль управления API-запросами с кэшированием и типизацией
 */
export class QueryModule {
  private storagePromise: Promise<IStorage>

  private storage: IStorage | null = null

  private baseQuery: BaseQueryFn

  private cacheManager: QueryCacheManager | null = null

  private endpoints: Record<string, Endpoint> = {}

  private abortControllers: Map<string, AbortController> = new Map()

  private initialized: Promise<void>

  constructor(private options: QueryModuleOptions) {
    // Инициализируем хранилище
    this.storagePromise = this.initializeStorage()

    // Инициализируем baseQuery
    this.baseQuery = this.initializeBaseQuery()

    // Инициализируем модуль
    this.initialized = this.initialize()
  }

  /**
   * Асинхронно инициализирует модуль
   */
  private async initialize(): Promise<void> {
    // Дожидаемся инициализации хранилища
    this.storage = await this.storagePromise

    // Инициализируем менеджер кэша
    this.cacheManager = new QueryCacheManager(this.storage, {
      ttl: this.options.cache?.ttl,
      invalidateOnError: this.options.cache?.invalidateOnError,
      tags: {},
    })

    // Инициализируем эндпоинты если указаны
    if (this.options.endpoints) {
      await this.initializeEndpoints()
    }
  }

  /**
   * Создает хранилище в зависимости от типа
   */
  private initializeStorage(): Promise<IStorage> {
    const { storageType, options, cache } = this.options

    // Создаем имя хранилища
    const name = options?.name || 'query-module'

    // Настройки middleware - только кэширование без batching и shallowCompare
    const middlewares = (getDefaultMiddleware: any) => {
      const middleware: any[] = []

      if (cache) {
        middleware.push(createCacheMiddleware({
          ttl: cache.ttl,
          cleanup: cache.cleanup,
          invalidateOnError: cache.invalidateOnError,
          rules: cache.rules,
        }))
      }

      return middleware
    }

    // Выбираем тип хранилища
    switch (storageType) {
      case 'indexedDB':
        return new IndexedDBStorage({
          name,
          options: {
            dbName: options?.dbName || 'query-cache',
            storeName: options?.storeName || 'requests',
            dbVersion: options?.dbVersion || 1,
          },
          middlewares,
        }).initialize()

      case 'localStorage':
        return new LocalStorage({
          name,
          middlewares,
        }).initialize()

      case 'memory':
      default:
        return new MemoryStorage({
          name,
          middlewares,
        }).initialize()
    }
  }

  /**
   * Инициализирует базовый запрос
   */
  private initializeBaseQuery(): BaseQueryFn {
    const { baseQuery } = this.options

    // Если передан объект конфигурации, создаем fetchBaseQuery
    if (!('then' in baseQuery)) {
      return fetchBaseQuery(baseQuery as FetchBaseQueryArgs)
    }

    // Иначе используем предоставленную функцию
    return baseQuery as BaseQueryFn
  }

  /**
   * Инициализирует эндпоинты из конфигурации
   */
  private async initializeEndpoints(): Promise<void> {
    const endpoints = this.options.endpoints?.() || {}

    for (const [name, config] of Object.entries(endpoints)) {
      this.endpoints[name] = await this.createEndpoint(name, config)
    }
  }

  /**
   * Создает новый эндпоинт
   */
  public async createEndpoint<TParams, TResult>(
    nameOrConfig: string | EndpointConfig<TParams, TResult>,
    config?: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    // Дожидаемся инициализации модуля
    await this.initialized

    if (!this.storage || !this.cacheManager) {
      throw new Error('QueryModule not properly initialized')
    }

    // Нормализуем параметры
    const name = typeof nameOrConfig === 'string' ? nameOrConfig : ''
    const endpointConfig = typeof nameOrConfig === 'string' ? config! : nameOrConfig
    const endpointName = name || `endpoint_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // Инициализируем начальное состояние
    const initialState: EndpointState<TResult> = {
      status: 'idle',
      meta: {
        tags: endpointConfig.tags || [],
        invalidatesTags: endpointConfig.invalidatesTags || [],
        cache: endpointConfig.cache || {},
      },
    }

    // Сохраняем начальное состояние в хранилище
    await this.storage.set(`endpoint:${endpointName}`, initialState)

    // Получаем локальную ссылку на cacheManager (для использования внутри замыканий)
    const { cacheManager } = this
    const { storage } = this

    // Создаем эндпоинт
    const endpoint: Endpoint<TParams, TResult> = {
      // Метод выполнения запроса
      fetch: async (params: TParams, options?: RequestOptions): Promise<TResult> => {
        try {
          // Проверяем кэш, если кэширование не отключено
          if (!options?.disableCache && cacheManager.shouldCache(endpointName)) {
            const requestDef = endpointConfig.request(params)
            const cachedResult = await cacheManager.get<TResult, Error>(
              endpointName,
              requestDef,
              params,
            )

            if (cachedResult) {
              // Обновляем состояние с данными из кэша
              await this.updateEndpointState(endpointName, {
                status: 'success',
                data: cachedResult.data as TResult,
              })

              return cachedResult.data as TResult
            }
          }

          // Обновляем состояние на loading
          await this.updateEndpointState(endpointName, {
            status: 'loading',
          })

          // Получаем определение запроса
          const requestDef = endpointConfig.request(params)

          // Создаем AbortController если не передан signal
          let controller: AbortController | undefined
          let signal = options?.signal

          if (!signal) {
            controller = new AbortController()
            signal = controller.signal
            this.abortControllers.set(endpointName, controller)
          }

          // Выполняем запрос
          const result = await this.baseQuery(requestDef, {
            ...options,
            signal,
          })

          // Очищаем контроллер
          if (controller) {
            this.abortControllers.delete(endpointName)
          }

          // Обрабатываем результат
          if (result.error) {
            // Обновляем состояние с ошибкой
            await this.updateEndpointState(endpointName, {
              status: 'error',
              error: result.error as Error,
            })

            throw result.error
          }

          // Обновляем состояние с успешным результатом
          await this.updateEndpointState(endpointName, {
            status: 'success',
            data: result.data as TResult,
          })

          // Кэшируем результат, если кэширование не отключено
          if (!options?.disableCache && cacheManager.shouldCache(endpointName)) {
            await cacheManager.set(
              endpointName,
              requestDef,
              params,
              result,
            )
          }

          return result.data as TResult
        } catch (error) {
          // Обновляем состояние с ошибкой
          await this.updateEndpointState(endpointName, {
            status: 'error',
            error: error as Error,
          })

          throw error
        }
      },

      // Подписка на изменения состояния
      subscribe: (callback): Unsubscribe => storage.subscribe(`endpoint:${endpointName}`, callback),

      // Получение текущего состояния
      getState: (): EndpointState<TResult> =>
        // Синхронный доступ к состоянию не доступен, возвращаем начальное
        // FIXME: Этот метод должен быть асинхронным для корректной работы
        initialState,

      // Инвалидация кэша по тегам
      invalidate: async (): Promise<void> => {
        // Инвалидируем кэш по тегам эндпоинта
        if (endpointConfig.invalidatesTags?.length) {
          await cacheManager.invalidateByTags(endpointConfig.invalidatesTags)
        }

        // Сбрасываем состояние
        await storage.set(`endpoint:${endpointName}`, {
          ...initialState,
          status: 'idle',
        })
      },

      // Сброс состояния эндпоинта
      reset: async (): Promise<void> => storage.set(`endpoint:${endpointName}`, initialState),

      // Отмена текущего запроса
      abort: (): void => {
        const controller = this.abortControllers.get(endpointName)
        if (controller) {
          controller.abort()
          this.abortControllers.delete(endpointName)
        }
      },

      // Метаданные эндпоинта
      meta: {
        name: endpointName,
        tags: endpointConfig.tags || [],
        invalidatesTags: endpointConfig.invalidatesTags || [],
        cache: endpointConfig.cache || {},
      },
    }

    // Регистрируем теги эндпоинта в cacheManager
    if (endpointConfig.tags?.length) {
      cacheManager.cacheOptions = cacheManager.cacheOptions || {}
      cacheManager.cacheOptions.tags = cacheManager.cacheOptions.tags || {}
      cacheManager.cacheOptions.tags[endpointName] = endpointConfig.tags
    }

    // Сохраняем эндпоинт
    this.endpoints[endpointName] = endpoint as Endpoint

    return endpoint
  }

  /**
   * Обновляет состояние эндпоинта
   */
  private async updateEndpointState<T>(
    endpointName: string,
    update: Partial<EndpointState<T>>,
  ): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized')
    }

    const current = await this.storage.get<EndpointState<T>>(`endpoint:${endpointName}`)

    if (!current) return

    await this.storage.set(`endpoint:${endpointName}`, {
      ...current,
      ...update,
    })
  }

  /**
   * Провайдер типизированного доступа к эндпоинтам
   * @returns Эндпоинты с типизацией
   */
  public getEndpoints<T extends Record<string, EndpointConfig>>(): {
    [K in keyof T]: Endpoint<ExtractParamsType<T[K]>, ExtractResultType<T[K]>>
    } {
    if (Object.keys(this.endpoints).length === 0) {
      // Может выполниться до инициализации модуля, но так быть не должно
      console.warn('Accessing endpoints before initialization')
    }

    return this.endpoints as any
  }
}
