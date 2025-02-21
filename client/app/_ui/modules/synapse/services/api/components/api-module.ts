import { ApiCache } from './api-cache'
import { EndpointFactory } from './endpoint-factory'
import { EndpointStateManager } from './endpoint-state-manager'
import { RequestExecutor } from './request-executor'
import { StorageManager } from './storage-manager'
import {
  ApiModuleOptions,
  BaseQueryFn,
  CacheConfig,
  Endpoint,
  EndpointBuilder,
  EndpointConfig,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  TypedEndpointConfig,
} from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'
import { fetchBaseQuery } from '../utils/fetch-base-query'

/**
 * Модуль управления API-запросами с кэшированием и типизацией
 */
// 5. ApiModule.ts - переработанный главный модуль
export class ApiModule {
  /** Менеджер хранилища */
  protected storageManager: StorageManager

  /** Менеджер состояния эндпоинтов */
  protected stateManager: EndpointStateManager

  /** Исполнитель запросов */
  protected requestExecutor: RequestExecutor

  /** Фабрика эндпоинтов */
  protected endpointFactory: EndpointFactory

  /** Менеджер кэша */
  protected cacheManager: ApiCache | null = null

  /** Базовая функция запроса */
  protected baseQuery: BaseQueryFn

  /** Реестр эндпоинтов */
  protected endpoints: Record<string, Endpoint> = {}

  /** Промис инициализации модуля */
  private initialized: Promise<void>

  /** Флаг доступности кэширования */
  private cachingEnabled: boolean = true

  /**
   * Создает новый экземпляр модуля API
   * @param options Настройки модуля
   */
  constructor(protected options: ApiModuleOptions) {
    // Инициализируем менеджер хранилища
    this.storageManager = new StorageManager(options.storageType, options.options)

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
      const storage = await this.storageManager.initialize()

      // Инициализируем менеджер состояния
      this.stateManager = new EndpointStateManager(this.storageManager)

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

      this.cacheManager = new ApiCache(storage, {
        ttl: cacheConfigObj?.ttl,
        invalidateOnError: cacheConfigObj?.invalidateOnError,
        tags: {},
        cacheableHeaderKeys: this.options.cacheableHeaderKeys,
        rules: cacheConfigObj?.rules,
        cleanup: cacheConfigObj?.cleanup,
      })

      // Инициализируем исполнитель запросов
      this.requestExecutor = new RequestExecutor(
        this.baseQuery,
        this.cacheManager,
        this.stateManager,
      )

      // Инициализируем фабрику эндпоинтов
      this.endpointFactory = new EndpointFactory(
        this.storageManager,
        this.stateManager,
        this.requestExecutor,
        this.cacheManager,
      )

      // Инициализируем эндпоинты если указаны
      if (this.options.endpoints) {
        await this.initializeEndpoints()
      }
    } catch (error) {
      this.cachingEnabled = false
      apiLogger.error('Ошибка инициализации API-модуля', error)

      // Инициализируем менеджер состояния
      this.stateManager = new EndpointStateManager(this.storageManager)

      // Инициализируем исполнитель запросов без кэша
      this.requestExecutor = new RequestExecutor(
        this.baseQuery,
        null,
        this.stateManager,
      )

      // Инициализируем фабрику эндпоинтов без кэша
      this.endpointFactory = new EndpointFactory(
        this.storageManager,
        this.stateManager,
        this.requestExecutor,
        null,
      )

      // По возможности инициализируем эндпоинты
      if (this.options.endpoints) {
        await this.initializeEndpoints()
      }
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

    const endpoint = await this.endpointFactory.createEndpoint(nameOrConfig, config)

    // Добавляем эндпоинт в реестр
    const name = typeof nameOrConfig === 'string'
      ? nameOrConfig
      : endpoint.meta.name

    this.endpoints[name] = endpoint

    return endpoint
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
    return this.storageManager.getStorage() !== null && this.cacheManager !== null
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
    this.requestExecutor.abortAllRequests()
  }
}
