import { ApiCache } from './api-cache'
import { IndexedDBStorage } from '../../../adapters/indexed-DB.service'
import { LocalStorage } from '../../../adapters/local-storage.service'
import { MemoryStorage } from '../../../adapters/memory-storage.service'
import { IStorage } from '../../../storage.interface'
import {
  BaseQueryFn,
  Endpoint,
  EndpointBuilder,
  EndpointConfig,
  EndpointState,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  QueryModuleOptions,
  RequestOptions,
  TypedEndpointConfig,
  Unsubscribe,
} from '../types/api.interface'
import { fetchBaseQuery } from '../utils'

/**
 * Модуль управления API-запросами с кэшированием и типизацией
 */
export class BaseApiClient {
  private storagePromise: Promise<IStorage>

  private storage: IStorage | null = null

  private baseQuery: BaseQueryFn

  private cacheManager: ApiCache | null = null

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
    this.cacheManager = new ApiCache(this.storage, {
      ttl: this.options.cache?.ttl,
      invalidateOnError: this.options.cache?.invalidateOnError,
      tags: {},
      cacheableHeaderKeys: this.options.cacheableHeaderKeys,
      rules: this.options.cache?.rules,
      cleanup: this.options.cache?.cleanup,
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
    const { storageType, options } = this.options

    // Создаем имя хранилища
    const name = options?.name || 'api-module'

    // Выбираем тип хранилища без middleware кэширования
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
        endpoints = typeof endpointsFn === 'function' ? endpointsFn(builder) : endpointsFn
      } catch (error) {
        console.error('Error initializing endpoints:', error)
        endpoints = {}
      }
    }

    for (const [name, config] of Object.entries(endpoints)) {
      // @ts-ignore
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
    const endpointConfig = typeof nameOrConfig === 'string'
      ? (config as EndpointConfig<TParams, TResult>)
      : (nameOrConfig as EndpointConfig<TParams, TResult>)
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
        // Объявляем переменную в начале функции
        let localAbortController: AbortController | undefined

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
          // Очищаем контроллер в случае ошибки
          if (localAbortController) {
            this.abortControllers.delete(endpointName)
          }

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
      getState: async (): Promise<EndpointState<TResult>> => {
        // Получаем текущее состояние из хранилища
        const state = await storage.get<EndpointState<TResult>>(`endpoint:${endpointName}`)
        return state || initialState
      },

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
      // Может выполниться до инициализации модуля, но так быть не должно
      console.warn('Accessing endpoints before initialization')
    }

    return this.endpoints as any
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
        console.error('Error aborting request:', error)
      }
    })
    this.abortControllers.clear()
  }
}
