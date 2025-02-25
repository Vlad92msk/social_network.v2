import { CacheManager } from './cache-manager'
import { Endpoint } from './endpoint'
import { EndpointStateManager } from './endpoint-state-manager'
import { EventBus } from './event-bus'
import { MiddlewareManager } from './middleware-manager'
import { RequestExecutor } from './request-executor'
import { StorageManager } from './storage-manager'
import { ApiModuleOptions, BaseQueryFn, EndpointConfig, FetchBaseQueryArgs } from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'
import { fetchBaseQuery } from '../utils/fetch-base-query'

/**
 * Базовый модуль API, обеспечивающий хранение, кэширование и выполнение запросов
 */
export class ApiModule {
  /** Менеджер хранилища */
  protected storageManager: StorageManager

  /** Менеджер состояния эндпоинтов */
  protected stateManager: EndpointStateManager

  /** Менеджер кэша */
  protected cacheManager: CacheManager | null = null

  /** Базовый запрос */
  protected baseQuery: BaseQueryFn

  /** Менеджер событий */
  protected eventBus: EventBus

  /** Менеджер middleware */
  protected middlewareManager: MiddlewareManager

  /** Исполнитель запросов */
  protected requestExecutor: RequestExecutor

  /** Реестр эндпоинтов */
  protected endpoints: Record<string, Endpoint> = {}

  /** Промис инициализации */
  private initialized: Promise<void>

  /** Флаг доступности кэширования */
  private cachingEnabled: boolean = true

  /**
   * Создает новый экземпляр API-модуля
   * @param options Настройки модуля
   */
  constructor(protected options: ApiModuleOptions) {
    // Инициализируем менеджер хранилища
    this.storageManager = new StorageManager(
      options.storageType || 'localStorage',
      options.options || {},
    )

    // Инициализируем менеджер событий
    this.eventBus = new EventBus()

    // Создаем менеджер middleware
    this.middlewareManager = new MiddlewareManager(
      (eventType, data) => this.eventBus.emit(eventType, data),
    )

    // Инициализируем baseQuery
    this.baseQuery = this.initializeBaseQuery()

    // Запускаем асинхронную инициализацию модуля
    this.initialized = this.initialize()
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
   * Асинхронно инициализирует модуль
   */
  private async initialize(): Promise<void> {
    try {
      // Дожидаемся инициализации хранилища
      await this.storageManager.initialize()

      // Инициализируем менеджер состояния
      this.stateManager = new EndpointStateManager(this.storageManager)

      // Инициализируем кэш-менеджер
      this.initializeCache()

      // Устанавливаем функцию получения глобальных опций для middleware
      this.middlewareManager.setGlobalOptionsProvider(() => ({
        cacheableHeaderKeys: this.options.cacheableHeaderKeys || [],
      }))

      // Инициализируем исполнитель запросов
      this.requestExecutor = new RequestExecutor(
        this.cacheManager,
        this.stateManager,
        this.middlewareManager,
        this.baseQuery,
        (eventType, data) => this.eventBus.emit(eventType, data),
      )

      // Инициализируем эндпоинты, если указаны
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
        null,
        this.stateManager,
        this.middlewareManager,
        this.baseQuery,
        (eventType, data) => this.eventBus.emit(eventType, data),
      )

      // По возможности инициализируем эндпоинты
      if (this.options.endpoints) {
        await this.initializeEndpoints()
      }
    }
  }

  /**
   * Инициализирует кэш-менеджер
   */
  private initializeCache(): void {
    const storage = this.storageManager.getStorage()

    if (!storage) {
      this.cachingEnabled = false
      this.cacheManager = null
      return
    }

    // Определяем параметры кэша
    let cacheConfig = this.options.cache

    if (cacheConfig === undefined) {
      // По умолчанию кэширование отключено
      cacheConfig = false
    } else if (cacheConfig === true) {
      // Если включено без настроек, используем настройки по умолчанию
      cacheConfig = { ttl: 30 * 60 * 1000 } // 30 минут
    }

    // Создаем менеджер кэша
    this.cacheManager = new CacheManager(storage, cacheConfig)
    this.cachingEnabled = cacheConfig !== false
  }

  /**
   * Инициализирует эндпоинты из конфигурации
   */
  protected async initializeEndpoints(): Promise<void> {
    try {
      // Если endpoints - это функция, вызываем её
      if (typeof this.options.endpoints === 'function') {
        const create = <TParams, TResult>(config: EndpointConfig<TParams, TResult>) => config
        const endpoints = await Promise.resolve(this.options.endpoints(create))

        // Создаем эндпоинты последовательно
        for (const [name, config] of Object.entries(endpoints)) {
          await this.createEndpoint(name, config)
        }
      }
      // Если endpoints - это объект, используем его напрямую
      else if (this.options.endpoints && typeof this.options.endpoints === 'object') {
        for (const [name, config] of Object.entries(this.options.endpoints)) {
          await this.createEndpoint(name, config)
        }
      }
    } catch (error) {
      apiLogger.error('Ошибка инициализации эндпоинтов', error)
      throw error
    }
  }

  /**
   * Создает новый эндпоинт и добавляет его в реестр
   * @param name Имя эндпоинта
   * @param config Конфигурация эндпоинта
   * @returns Созданный эндпоинт
   */
  protected async createEndpoint<TParams, TResult>(
    name: string,
    config: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    try {
      // Ждем завершения инициализации
      await this.waitForInitialization()

      // Создаем эндпоинт
      const endpoint = await Endpoint.create<TParams, TResult>({
        endpointName: name,
        endpointConfig: config,
        stateManager: this.stateManager,
        requestExecutor: this.requestExecutor,
        eventBus: this.eventBus,
        middlewareManager: this.middlewareManager,
        cacheManager: this.cacheManager,
      })

      // Добавляем эндпоинт в реестр
      this.endpoints[name] = endpoint

      return endpoint
    } catch (error) {
      apiLogger.error(`Ошибка создания эндпоинта ${name}`, error)
      throw error
    }
  }

  /**
   * Получает все эндпоинты
   * @returns Объект с эндпоинтами
   */
  public getEndpoints<T extends Record<string, EndpointConfig>>(): Record<string, Endpoint> {
    return this.endpoints
  }

  /**
   * Проверяет, завершена ли инициализация модуля
   * @returns true если модуль инициализирован
   */
  public isInitialized(): boolean {
    return this.storageManager.isInitialized()
  }

  /**
   * Ожидает завершения инициализации модуля
   * @returns Promise, который завершается после инициализации
   */
  public async waitForInitialization(): Promise<void> {
    return this.initialized
  }

  /**
   * Очищает ресурсы при удалении клиента
   */
  public destroy(): void {
    // Останавливаем очистку кэша
    if (this.cacheManager) {
      this.cacheManager.destroy()
    }

    // Отменяем все текущие запросы
    if (this.requestExecutor) {
      this.requestExecutor.abortAllRequests()
    }

    // Удаляем все обработчики событий
    if (this.eventBus) {
      this.eventBus.destroy()
    }

    // Очищаем middleware
    if (this.middlewareManager) {
      this.middlewareManager.clear()
    }
  }
}
