import { StateRequest } from '@ui/modules/synapse/services/api'
import { CacheManager } from './cache-manager'
import { Endpoint } from './endpoint'
import { EndpointStateManager } from './endpoint-state-manager'
import { EventBus } from './event-bus'
import { MiddlewareManager } from './middleware-manager'
import { RequestExecutor } from './request-executor'
import { QueryStorage } from './query-storage'
import { ApiEventData, ApiEventType } from '../types/api-events.interface'
import { EnhancedApiMiddleware } from '../types/api-middleware.interface'
import {
  ApiModuleOptions,
  BaseQueryFn,
  CreateEndpoint,
  EndpointConfig,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  RequestOptions,
  TypedApiModuleOptions,
  TypedEndpointConfig,
  Unsubscribe,
} from '../types/api.interface'
import { apiLogger, createUniqueId } from '../utils/api-helpers'
import { fetchBaseQuery } from '../utils/fetch-base-query'

/**
 * Улучшенный типизированный клиент API с поддержкой middleware и событий
 */
export class ApiClient<T extends Record<string, TypedEndpointConfig<any, any>>> {
  /** Менеджер хранилища */
  protected storageManager: QueryStorage

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

  /** Глобальные настройки заголовков для кэша */
  private _globalCacheableHeaderKeys: string[]

  /**
   * Создает новый экземпляр типизированного API-клиента
   * @param options Типизированные настройки модуля
   */
  constructor(protected options: TypedApiModuleOptions<T>) {
    // Создаем копию опций для модификации
    const modifiedOptions: TypedApiModuleOptions<T> = { ...options }

    // Сохраняем глобальные настройки заголовков для кэша
    this._globalCacheableHeaderKeys = modifiedOptions.cacheableHeaderKeys || []

    // Если endpoints задан как объект, а не функция, обернем его в функцию
    if (options.endpoints && typeof options.endpoints !== 'function') {
      const endpointsObj = options.endpoints
      //@ts-ignore
      modifiedOptions.endpoints = (_create) => endpointsObj
    }

    // Если baseQuery - это объект настроек fetchBaseQuery,
    // передаем настройки кэшируемых заголовков
    if (modifiedOptions.baseQuery
      && typeof modifiedOptions.baseQuery === 'object'
      && !('then' in modifiedOptions.baseQuery)) {
      modifiedOptions.baseQuery = {
        ...modifiedOptions.baseQuery,
        cacheableHeaderKeys: this._globalCacheableHeaderKeys,
      }
    }

    // Инициализируем менеджер хранилища
    this.storageManager = new QueryStorage(
      modifiedOptions.storageType,
      modifiedOptions.options || {},
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

    // Устанавливаем поставщик глобальных опций для middleware
    this.middlewareManager.setGlobalOptionsProvider(() => ({
      cacheableHeaderKeys: this._globalCacheableHeaderKeys,
    }))
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

      // Инициализируем менеджер кэша
      this.initializeCache()

      // Инициализируем исполнитель запросов
      this.requestExecutor = new RequestExecutor(
        this.cacheManager,
        this.stateManager,
        this.middlewareManager,
        this.baseQuery,
        (eventType, data) => this.eventBus.emit(eventType, data),
      )

      // Устанавливаем функцию получения глобальных опций для middleware
      this.middlewareManager.setGlobalOptionsProvider(() => ({
        cacheableHeaderKeys: this._globalCacheableHeaderKeys,
      }))

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
      const create: CreateEndpoint = <TParams, TResult>(config: EndpointConfig<TParams, TResult>) => config

      const endpointsFn = this.options.endpoints
      if (endpointsFn) {
        // Преобразуем endpoints в Promise, независимо от типа
        let endpointsResult: Record<string, EndpointConfig>

        if (typeof endpointsFn === 'function') {
          endpointsResult = await Promise.resolve(endpointsFn(create))
        } else {
          // Если endpoints это объект, используем его напрямую
          endpointsResult = endpointsFn
        }

        // Создаем эндпоинты последовательно
        for (const [name, config] of Object.entries(endpointsResult)) {
          try {
            this.endpoints[name] = await this.createEndpoint(name, config)
          } catch (error) {
            apiLogger.error(`Ошибка создания эндпоинта ${name}:`, error)
            throw error
          }
        }
      }
    } catch (error) {
      apiLogger.error('Ошибка в initializeEndpoints:', error)
      throw error
    }
  }

  /**
   * Создает новый эндпоинт и добавляет его в реестр
   * @param nameOrConfig Имя эндпоинта или его конфигурация
   * @param config Конфигурация эндпоинта (если первый параметр - имя)
   * @returns Promise с созданным эндпоинтом
   */
  public async createEndpoint<TParams, TResult>(
    nameOrConfig: string | EndpointConfig<TParams, TResult>,
    config?: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    try {
      // Нормализуем параметры
      const name = typeof nameOrConfig === 'string' ? nameOrConfig : ''
      const endpointConfig = typeof nameOrConfig === 'string'
        ? (config as EndpointConfig<TParams, TResult>)
        : (nameOrConfig as EndpointConfig<TParams, TResult>)
      const endpointName = name || `endpoint_${createUniqueId()}`

      // Ждем завершения инициализации
      await this.waitForInitialization()

      // Создаем эндпоинт
      const endpoint = await Endpoint.create<TParams, TResult>({
        endpointName,
        endpointConfig,
        stateManager: this.stateManager,
        storageManager: this.storageManager,
        requestExecutor: this.requestExecutor,
        eventManager: this.eventBus,
        middlewareManager: this.middlewareManager,
        cacheManager: this.cacheManager,
      })

      // Добавляем эндпоинт в реестр если он не анонимный
      if (name) {
        this.endpoints[endpointName] = endpoint
      }

      return endpoint
    } catch (error) {
      apiLogger.error('Ошибка в createEndpoint:', error)
      throw error
    }
  }

  /**
   * Получает все эндпоинты с улучшенной типизацией
   * @returns Типизированный объект эндпоинтов
   */
  public getEndpoints<U extends Record<string, EndpointConfig> = T>(): {
    [K in keyof U]: Endpoint<ExtractParamsType<U[K]>, ExtractResultType<U[K]>>
    } {
    return this.endpoints as any
  }

  /**
   * Получает глобальные настройки кэшируемых заголовков
   * @returns Массив ключей заголовков
   */
  public getCacheableHeaderKeys(): string[] {
    return [...this._globalCacheableHeaderKeys]
  }

  /**
   * Устанавливает глобальные настройки кэшируемых заголовков
   * @param keys Массив ключей заголовков
   */
  public setCacheableHeaderKeys(keys: string[]): void {
    this._globalCacheableHeaderKeys = [...keys]

    // Обновляем поставщик глобальных опций для middleware
    this.middlewareManager.setGlobalOptionsProvider(() => ({
      cacheableHeaderKeys: this._globalCacheableHeaderKeys,
    }))
  }

  /**
   * Выполняет запрос к API с типизацией и обработкой ошибок
   * @param endpointName Имя эндпоинта (с подсказками TypeScript)
   * @param params Параметры запроса (с типизацией)
   * @param options Опции запроса
   * @returns Promise с типизированным результатом запроса
   */
  public async request<K extends keyof T & string>(
    endpointName: K,
    params: ExtractParamsType<T[K]>,
    options?: RequestOptions,
  ): Promise<ExtractResultType<T[K]>> {
    // Дожидаемся полной инициализации перед выполнением запроса
    await this.waitForInitialization()

    const endpoints = this.getEndpoints<T>()
    const endpoint = endpoints[endpointName]

    if (!endpoint) {
      throw new Error(`Эндпоинт ${String(endpointName)} не найден`)
    }

    try {
      const stateRequest: StateRequest<ExtractResultType<T[K]>> = endpoint.fetch(params, options)
      return await stateRequest.wait()
    } catch (error) {
      apiLogger.error(`Ошибка запроса к ${String(endpointName)}`, { error, params })
      throw error
    }
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
   * Инициализирует API-клиент
   * @returns Promise с инициализированным клиентом
   */
  public async init(): Promise<this> {
    await this.waitForInitialization()
    return this
  }

  /**
   * Добавляет middleware для перехвата запросов
   * @param middleware Объект middleware
   * @returns this для цепочки вызовов
   */
  public use(middleware: EnhancedApiMiddleware): this {
    this.middlewareManager.use(middleware)
    return this
  }

  /**
   * Удаляет middleware по имени
   * @param name Имя middleware
   * @returns true если middleware был удален, иначе false
   */
  public removeMiddleware(name: string): boolean {
    return this.middlewareManager.remove(name)
  }

  /**
   * Получает экземпляр менеджера middleware
   * @returns Экземпляр менеджера middleware
   */
  public getMiddlewareManager() {
    return this.middlewareManager
  }

  /**
   * Удаляет все middleware
   */
  public clearMiddleware(): void {
    this.middlewareManager.clear()
  }

  /**
   * Подписка на события конкретного эндпоинта с типизацией
   * @param endpointName Имя эндпоинта (с подсказками TypeScript)
   * @param listener Обработчик события с типизацией для конкретного эндпоинта
   * @returns Функция для отписки
   */
  public subscribeEndpoint<K extends keyof T & string>(
    endpointName: K,
    listener: (data: ApiEventData & { endpointName: string }) => void,
  ): Unsubscribe {
    return this.eventBus.subscribeEndpoint(
      String(endpointName),
      listener,
    )
  }

  /**
   * Подписка на определённый тип события с типизацией для всех эндпоинтов
   * @param eventType Тип события
   * @param listener Обработчик события с типизацией
   * @returns Функция для отписки
   */
  public subscribeEvent<E extends ApiEventType>(
    eventType: E,
    listener: (data: Extract<ApiEventData, { type: E }>) => void,
  ): Unsubscribe {
    return this.eventBus.subscribe(eventType, listener)
  }

  /**
   * Подписка на события группы эндпоинтов по тегу
   * @param tag Тег группы эндпоинтов
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribeTag(
    tag: string,
    listener: (data: ApiEventData) => void,
  ): Unsubscribe {
    return this.eventBus.subscribeTag(tag, listener)
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

/**
 * Создает и инициализирует экземпляр API-клиента
 * Ожидает завершения инициализации перед возвратом
 * @param options Типизированные настройки модуля
 * @returns Promise с инициализированным API-клиентом
 */
export async function createInitializedApiClient<T extends Record<string, TypedEndpointConfig<any, any>>>(
  options: TypedApiModuleOptions<T>,
): Promise<ApiClient<T>> {
  const apiClient = new ApiClient<T>(options)
  await apiClient.waitForInitialization()
  return apiClient
}

/**
 * Создает новый экземпляр API-клиента без ожидания инициализации
 * @param options Типизированные настройки модуля
 * @returns Экземпляр API-клиента
 */
export function createApiClient<T extends Record<string, TypedEndpointConfig<any, any>>>(
  options: TypedApiModuleOptions<T>,
): ApiClient<T> {
  return new ApiClient<T>(options)
}
