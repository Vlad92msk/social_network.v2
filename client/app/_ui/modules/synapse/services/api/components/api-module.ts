import { ApiCache } from './api-cache'
import { IndexedDBStorage } from '../../storage/adapters/indexed-DB.service'
import { LocalStorage } from '../../storage/adapters/local-storage.service'
import { MemoryStorage } from '../../storage/adapters/memory-storage.service'
import { IStorage } from '../../storage/storage.interface'
import {
  ApiModuleOptions,
  BaseQueryFn, CacheConfig,
  Endpoint,
  EndpointBuilder,
  EndpointConfig,
  EndpointState,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  RequestOptions,
  TypedEndpointConfig,
  Unsubscribe,
} from '../types/api.interface'
import { apiLogger, createUniqueId } from '../utils/api-helpers'
import { fetchBaseQuery } from '../utils/fetch-base-query'

/**
 * Модуль управления API-запросами с кэшированием и типизацией
 */
export class ApiModule {
  /** Промис инициализации хранилища */
  private storagePromise: Promise<IStorage>

  /** Инициализированное хранилище */
  private storage: IStorage | null = null

  /** Базовая функция запроса */
  private baseQuery: BaseQueryFn

  /** Менеджер кэша */
  private cacheManager: ApiCache | null = null

  /** Реестр эндпоинтов */
  private endpoints: Record<string, Endpoint> = {}

  /** Активные AbortController'ы для отмены запросов */
  private abortControllers: Map<string, AbortController> = new Map()

  /** Промис инициализации модуля */
  private initialized: Promise<void>

  /** Флаг доступности кэширования */
  private cachingEnabled: boolean = true

  /**
   * Создает новый экземпляр модуля API
   * @param options Настройки модуля
   */
  constructor(protected options: ApiModuleOptions) {
    // Инициализируем хранилище
    this.storagePromise = this.initializeStorage()

    // Инициализируем baseQuery
    this.baseQuery = this.initializeBaseQuery()

    // Инициализируем модуль
    this.initialized = this.initialize()
  }

  /**
   * Асинхронно инициализирует модуль
   * @returns Promise, который завершается после инициализации
   */
  private async initialize(): Promise<void> {
    try {
      // Дожидаемся инициализации хранилища
      this.storage = await this.storagePromise

      // Инициализируем менеджер кэша
      let cacheConfigObj: {
        ttl?: number,
        invalidateOnError?: boolean,
        // @ts-ignore
        rules?: CacheConfig['rules'],
        cleanup?: { enabled: boolean, interval?: number }
      } | undefined

      if (this.options.cache === true) {
        cacheConfigObj = { ttl: 30 * 60 * 1000 }
      } else if (typeof this.options.cache === 'object') {
        cacheConfigObj = this.options.cache
      }

      this.cacheManager = new ApiCache(this.storage, {
        ttl: cacheConfigObj?.ttl,
        invalidateOnError: cacheConfigObj?.invalidateOnError,
        tags: {},
        cacheableHeaderKeys: this.options.cacheableHeaderKeys,
        rules: cacheConfigObj?.rules,
        cleanup: cacheConfigObj?.cleanup,
      })

      // Инициализируем эндпоинты если указаны
      if (this.options.endpoints) {
        await this.initializeEndpoints()
      }
    } catch (error) {
      this.cachingEnabled = false
      apiLogger.error('Ошибка инициализации API-модуля', error)
      // Инициализируем в режиме без кэширования
      this.cacheManager = null
      // По возможности инициализируем эндпоинты
      if (this.options.endpoints) {
        await this.initializeEndpoints()
      }
    }
  }

  /**
   * Создает хранилище в зависимости от типа
   * @returns Promise с инициализированным хранилищем
   */
  private initializeStorage(): Promise<IStorage> {
    const { storageType, options } = this.options

    // Создаем имя хранилища
    const name = options?.name || 'api-module'

    try {
      // Выбираем тип хранилища
      switch (storageType) {
        case 'indexedDB':
          return new IndexedDBStorage({
            name,
            options: {
              dbName: options?.dbName || 'api-cache',
              storeName: options?.storeName || 'requests',
              dbVersion: options?.dbVersion || 1,
            },
          }).initialize()

        case 'localStorage':
          return new LocalStorage({ name }).initialize()

        case 'memory':
        default:
          return new MemoryStorage({ name }).initialize()
      }
    } catch (error) {
      apiLogger.error('Ошибка инициализации хранилища', error)
      // Возвращаем хранилище в памяти как запасной вариант
      return new MemoryStorage({ name: `${name}-fallback` }).initialize()
    }
  }

  /**
   * Инициализирует базовый запрос
   * @returns Функция базового запроса
   */
  private initializeBaseQuery(): BaseQueryFn {
    const { baseQuery } = this.options

    // Если передан объект конфигурации, создаем fetchBaseQuery
    if (baseQuery && typeof baseQuery === 'object' && !('then' in baseQuery)) {
      return fetchBaseQuery(baseQuery as FetchBaseQueryArgs)
    }

    // Иначе используем предоставленную функцию
    return baseQuery as BaseQueryFn
  }

  /**
   * Инициализирует эндпоинты из конфигурации
   */
  private async initializeEndpoints(): Promise<void> {
    // Создаем базовый билдер для endpoint'ов
    const builder: EndpointBuilder = {
      create: <TParams, TResult>(
        config: Omit<EndpointConfig<TParams, TResult>, 'response'>,
      ): TypedEndpointConfig<TParams, TResult> =>
        // Создаем новый объект с полем response для правильного вывода типов
        ({
          ...config,
          response: null as unknown as TResult, // Используется только для типизации
        } as TypedEndpointConfig<TParams, TResult>)
      ,
    }

    // Проверяем, принимает ли функция endpoints аргумент builder
    const endpointsFn = this.options.endpoints
    let endpoints = {}

    if (endpointsFn) {
      try {
        // Проверяем количество параметров функции
        endpoints = typeof endpointsFn === 'function'
          ? endpointsFn.length > 0
            ? endpointsFn(builder)
            // @ts-ignore
            : endpointsFn()
          : endpointsFn
      } catch (error) {
        apiLogger.error('Ошибка инициализации эндпоинтов', error)
        endpoints = {}
      }
    }

    // Создаем эндпоинты
    for (const [name, config] of Object.entries(endpoints)) {
      try {
        // @ts-ignore - config может быть разных типов
        this.endpoints[name] = await this.createEndpoint(name, config)
      } catch (error) {
        apiLogger.error(`Ошибка создания эндпоинта ${name}`, error)
      }
    }
  }

  /**
   * Создает новый эндпоинт
   * @param nameOrConfig Имя эндпоинта или его конфигурация
   * @param config Конфигурация эндпоинта (если первый параметр - имя)
   * @returns Promise с созданным эндпоинтом
   */
  public async createEndpoint<TParams, TResult>(
    nameOrConfig: string | EndpointConfig<TParams, TResult>,
    config?: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    // Дожидаемся инициализации модуля
    await this.initialized

    if (!this.storage) {
      throw new Error('API-модуль не инициализирован')
    }

    // Нормализуем параметры
    const name = typeof nameOrConfig === 'string' ? nameOrConfig : ''
    const endpointConfig = typeof nameOrConfig === 'string'
      ? (config as EndpointConfig<TParams, TResult>)
      : (nameOrConfig as EndpointConfig<TParams, TResult>)
    const endpointName = name || `endpoint_${createUniqueId()}`

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

    // Создаем эндпоинт
    const endpoint = await this.createEndpointImplementation<TParams, TResult>(
      endpointName,
      endpointConfig,
      initialState,
    )

    // Регистрируем эндпоинт
    this.endpoints[endpointName] = endpoint

    return endpoint
  }

  /**
   * Внутренний метод создания реализации эндпоинта
   * @param endpointName Имя эндпоинта
   * @param endpointConfig Конфигурация эндпоинта
   * @param initialState Начальное состояние эндпоинта
   * @returns Реализация эндпоинта
   */
  private async createEndpointImplementation<TParams, TResult>(
    endpointName: string,
    endpointConfig: EndpointConfig<TParams, TResult>,
    initialState: EndpointState<TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    if (!this.storage) {
      throw new Error('Хранилище не инициализировано')
    }

    // Регистрируем теги эндпоинта в cacheManager, если кэширование включено
    if (this.cacheManager && endpointConfig.tags?.length) {
      this.cacheManager.registerTags(endpointName, endpointConfig.tags)
    }

    // Создаем эндпоинт
    const endpoint: Endpoint<TParams, TResult> = {
      // Метод выполнения запроса
      fetch: async (params: TParams, options?: RequestOptions): Promise<TResult> => {
        let localAbortController: AbortController | undefined

        try {
          const shouldUseCache = this.shouldUseCache(endpointName, options, endpointConfig)

          // Проверяем кэш, если кэширование не отключено
          if (shouldUseCache && this.cacheManager) {
            const requestDef = endpointConfig.request(params)
            const cachedResult = await this.cacheManager.get<TResult>(
              endpointName,
              requestDef,
              params,
            )

            if (cachedResult) {
              apiLogger.debug(
                `Обнаружены кэшированные данные для ${endpointName}`,
                { tags: endpointConfig.tags },
              )

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
          let signal = options?.signal

          if (!signal) {
            localAbortController = new AbortController()
            signal = localAbortController.signal
            this.abortControllers.set(endpointName, localAbortController)
          }

          // Выполняем запрос
          const result = await this.baseQuery(requestDef, {
            ...options,
            signal,
          })

          // Очищаем контроллер
          if (localAbortController) {
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
          if (shouldUseCache && this.cacheManager) {
            await this.cacheManager.set(
              endpointName,
              requestDef,
              params,
              result,
            )
          }

          return result.data as TResult
        } catch (error) {
          // Очищаем контроллер в случае ошибки
          if (localAbortController) {
            this.abortControllers.delete(endpointName)
          }

          // Обновляем состояние с ошибкой
          await this.updateEndpointState(endpointName, {
            status: 'error',
            error: error as Error,
          })

          // Инвалидируем кэш при ошибке, если настроено
          if (this.cacheManager
          // @ts-ignore
              && this.options?.cache?.invalidateOnError
              && endpointConfig.tags?.length) {
            await this.cacheManager.invalidateByTags(endpointConfig.tags)
          }

          throw error
        }
      },

      // Подписка на изменения состояния
      subscribe: (callback): Unsubscribe => {
        if (!this.storage) {
          apiLogger.warn('Попытка подписки до инициализации хранилища')
          return () => {}
        }
        return this.storage.subscribe(`endpoint:${endpointName}`, callback)
      },

      // Получение текущего состояния
      getState: async (): Promise<EndpointState<TResult>> => {
        if (!this.storage) {
          return initialState
        }
        // Получаем текущее состояние из хранилища
        const state = await this.storage.get<EndpointState<TResult>>(`endpoint:${endpointName}`)
        return state || initialState
      },

      // Инвалидация кэша по тегам
      invalidate: async (): Promise<void> => {
        // Инвалидируем кэш по тегам эндпоинта
        if (this.cacheManager && endpointConfig.invalidatesTags?.length) {
          await this.cacheManager.invalidateByTags(endpointConfig.invalidatesTags)
        }

        // Сбрасываем состояние
        if (this.storage) {
          await this.storage.set(`endpoint:${endpointName}`, {
            ...initialState,
            status: 'idle',
          })
        }
      },

      // Сброс состояния эндпоинта
      reset: async (): Promise<void> => {
        if (this.storage) {
          await this.storage.set(`endpoint:${endpointName}`, initialState)
        }
      },

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

    return endpoint
  }

  /**
   * Проверяет, должен ли запрос использовать кэш
   * @param endpointName Имя эндпоинта
   * @param options Опции запроса
   * @param endpointConfig Конфигурация эндпоинта
   * @returns true если нужно использовать кэш
   */
  private shouldUseCache(endpointName: string, options?: RequestOptions, endpointConfig?: EndpointConfig): boolean {
    // Если кэширование выключено глобально, возвращаем false
    if (!this.cachingEnabled) return false

    // Если в опциях запроса отключено кэширование, возвращаем false
    if (options?.disableCache) return false

    // Если кэш-менеджер недоступен, возвращаем false
    if (!this.cacheManager) return false

    // Если в конфигурации эндпоинта явно отключено кэширование
    if (endpointConfig?.cache === false) return false

    // Если в конфигурации эндпоинта явно включено кэширование
    if (endpointConfig?.cache === true) return true

    // Проверяем правила кэширования в кэш-менеджере
    return this.cacheManager.shouldCache(endpointName)
  }

  /**
   * Обновляет состояние эндпоинта
   * @param endpointName Имя эндпоинта
   * @param update Частичное обновление состояния
   */
  private async updateEndpointState<T>(
    endpointName: string,
    update: Partial<EndpointState<T>>,
  ): Promise<void> {
    if (!this.storage) {
      throw new Error('Хранилище не инициализировано')
    }

    const current = await this.storage.get<EndpointState<T>>(`endpoint:${endpointName}`)

    if (!current) {
      // Создаем начальное состояние если оно отсутствует
      const initialState = {
        status: 'idle',
        meta: {
          tags: [],
          invalidatesTags: [],
          cache: {},
        },
        ...update,
      } as EndpointState<T>
      return this.storage.set(`endpoint:${endpointName}`, initialState)
    }

    // Обновляем состояние
    return this.storage.set(`endpoint:${endpointName}`, {
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
      apiLogger.warn('Получение эндпоинтов до завершения инициализации')
    }

    return this.endpoints as any
  }

  /**
   * Проверяет, завершена ли инициализация модуля
   * @returns true если модуль инициализирован
   */
  public isInitialized(): boolean {
    return this.storage !== null && this.cacheManager !== null
  }

  /**
   * Ожидает завершения инициализации модуля
   * @returns Promise, который завершается после инициализации
   */
  public waitForInitialization(): Promise<void> {
    return this.initialized
  }

  /**
   * Очищает ресурсы при удалении клиента
   */
  public dispose(): void {
    // Останавливаем очистку кэша
    if (this.cacheManager) {
      this.cacheManager.dispose()
    }

    // Отменяем все текущие запросы
    this.abortControllers.forEach((controller) => {
      try {
        controller.abort()
      } catch (error) {
        apiLogger.error('Ошибка отмены запроса', error)
      }
    })
    this.abortControllers.clear()
  }
}
