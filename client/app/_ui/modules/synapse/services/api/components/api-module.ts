import { ApiCache } from './api-cache'
import { EndpointStateManager } from './endpoint-state-manager'
import { RequestExecutor } from './request-executor'
import { StorageManager } from './storage-manager'
import {
  ApiModuleOptions, BaseQueryFn, CacheConfig, Endpoint, EndpointConfig, ExtractParamsType, ExtractResultType, FetchBaseQueryArgs,
} from '../types/api.interface'
import { apiLogger } from '../utils/api-helpers'
import { fetchBaseQuery } from '../utils/fetch-base-query'

/**
 * Модуль управления API-запросами с кэшированием и типизацией
 */
export class ApiModule {
  /** Менеджер хранилища */
  protected storageManager: StorageManager

  /** Менеджер состояния эндпоинтов */
  protected stateManager: EndpointStateManager

  /** Исполнитель запросов */
  protected requestExecutor: RequestExecutor

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
      let cacheConfigObj: CacheConfig = {}

      if (this.options.cache === true) {
        cacheConfigObj = { ttl: 30 * 60 * 1000 }
      } else if (typeof this.options.cache === 'object') {
        cacheConfigObj = this.options.cache
      }

      this.cacheManager = new ApiCache(storage, {
        ...cacheConfigObj,
        tags: {},
        cacheableHeaderKeys: this.options.cacheableHeaderKeys,
      })

      // Инициализируем исполнитель запросов
      this.requestExecutor = new RequestExecutor(
        this.baseQuery,
        this.cacheManager,
        this.stateManager,
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
   * @remarks Метод базового класса делегирует создание эндпоинтов наследникам
   */
  protected async initializeEndpoints(): Promise<void> {
    console.log('ApiModule.initializeEndpoints: This method should be overridden by child classes')
    // Базовая реализация ничего не делает, так как метод createEndpoint теперь только в ApiClient
    // Наследники должны переопределить этот метод, чтобы создавать эндпоинты
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

    // Отменяем все текущие запросы только если requestExecutor уже создан
    if (this.requestExecutor) {
      this.requestExecutor.abortAllRequests()
    }
  }
}
