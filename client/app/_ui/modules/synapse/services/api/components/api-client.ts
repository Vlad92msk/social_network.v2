import { ApiSubscriber } from './api-subscriber'
import { ApiMiddlewareManager } from './api-middleware-manager'
import { ApiModule } from './api-module'
import { Endpoint } from './endpoint'
import { ApiEventData, ApiEventType } from '../types/api-events.interface'
import { EnhancedApiMiddleware } from '../types/api-middleware.interface'
import {
  CreateEndpoint,
  EndpointConfig,
  ExtractParamsType,
  ExtractResultType,
  RequestOptions,
  TypedApiModuleOptions,
  TypedEndpointConfig,
  Unsubscribe,
} from '../types/api.interface'
import { apiLogger, createUniqueId } from '../utils/api-helpers'

/**
 * Помощник для создания типизированных событий для конкретного эндпоинта
 */
type EndpointEventData<
  T,
  K extends keyof T,
  E extends ApiEventData
> = Omit<E, 'params' | 'result'> & {
  endpointName: K
  params: ExtractParamsType<T[K]>
  result?: ExtractResultType<T[K]>
  context?: {
    type: ApiEventType
    tag?: string
    [key: string]: any
  }
}

/**
 * Улучшенный типизированный клиент API с типизированными подписками
 */
export class ApiClient<T extends Record<string, TypedEndpointConfig<any, any>>> extends ApiModule {
  /** Глобальные настройки заголовков для кэша */
  private _globalCacheableHeaderKeys: string[]

  /** Менеджер событий */
  private eventSubscriber: ApiSubscriber

  /** Менеджер middleware */
  private middlewareManager: ApiMiddlewareManager

  /**
   * Создает новый экземпляр типизированного API-клиента
   * @param options Типизированные настройки модуля
   */
  constructor(options: TypedApiModuleOptions<T>) {
    // Создаем копию опций для модификации
    const modifiedOptions = { ...options }

    // Сохраняем глобальные настройки заголовков для кэша
    const globalCacheableHeaderKeys = modifiedOptions.cacheableHeaderKeys || []

    // Если endpoints задан как объект, а не функция, обернем его в функцию
    if (options.endpoints && typeof options.endpoints !== 'function') {
      const endpointsObj = options.endpoints
      modifiedOptions.endpoints = (create) => endpointsObj
    }

    // Если baseQuery - это объект настроек fetchBaseQuery,
    // передаем настройки кэшируемых заголовков
    if (modifiedOptions.baseQuery && typeof modifiedOptions.baseQuery === 'object' && !('then' in modifiedOptions.baseQuery)) {
      modifiedOptions.baseQuery = {
        ...modifiedOptions.baseQuery,
        cacheableHeaderKeys: globalCacheableHeaderKeys,
      }
    }

    super(modifiedOptions as any)
    this._globalCacheableHeaderKeys = globalCacheableHeaderKeys

    // Инициализируем менеджер событий
    this.eventSubscriber = new ApiSubscriber()

    // Инициализируем менеджер middleware и связываем его с менеджером событий
    this.middlewareManager = new ApiMiddlewareManager(
      (eventType, data) => this.emitEvent(eventType, data),
    )

    // Устанавливаем функцию для получения глобальных опций
    this.middlewareManager.setGlobalOptionsProvider(() => ({
      cacheableHeaderKeys: this._globalCacheableHeaderKeys,
    }))
  }

  /**
   * Переопределяем getEndpoints с улучшенной типизацией
   * @returns Типизированный объект эндпоинтов
   */
  public getEndpoints<U extends Record<string, EndpointConfig> = T>(): {
    [K in keyof U]: Endpoint<ExtractParamsType<U[K]>, ExtractResultType<U[K]>>
    } {
    return super.getEndpoints<U>() as any
  }

  /**
   * Создает новый эндпоинт с поддержкой контекста, событий и middleware
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

      // Создаем экземпляр эндпоинта
      const endpoint = await Endpoint.create<TParams, TResult>({
        endpointName,
        endpointConfig,
        stateManager: this.stateManager,
        storageManager: this.storageManager,
        cacheManager: this.cacheManager,
        requestExecutor: this.requestExecutor,
        eventManager: this.eventSubscriber,
        middlewareManager: this.middlewareManager,
      })

      // Сохраняем эндпоинт в реестре
      this.endpoints[endpointName] = endpoint

      return endpoint
    } catch (error) {
      console.error('Error in createEndpoint:', error)
      throw error
    }
  }

  /**
   * Переопределяет метод инициализации эндпоинтов
   */
  protected override async initializeEndpoints(): Promise<void> {
    try {
      const create: CreateEndpoint = <TParams, TResult>(config: EndpointConfig<TParams, TResult>) => config

      const endpointsFn = this.options.endpoints
      if (endpointsFn) {
        const endpoints = await endpointsFn(create)

        // Создаем эндпоинты последовательно
        for (const [name, config] of Object.entries(endpoints)) {
          try {
            this.endpoints[name] = await this.createEndpoint(name, config)
          } catch (error) {
            console.error(`Error creating endpoint ${name}:`, error)
            throw error // Или обработать по-другому если нужно
          }
        }
      }
    } catch (error) {
      console.error('Error in initializeEndpoints:', error)
      throw error
    }
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
  }

  /**
   * Выполняет запрос к API с типизацией и обработкой ошибок
   * @param endpointName Имя эндпоинта (с подсказками TypeScript)
   * @param params Параметры запроса (с типизацией)
   * @param options Опции запроса
   * @returns Promise с типизированным результатом запроса
   */
  public async request<K extends keyof T, P extends ExtractParamsType<T[K]>, R extends ExtractResultType<T[K]>>(
    endpointName: K,
    params: P,
    options?: RequestOptions,
  ): Promise<R> {
    // Дожидаемся полной инициализации перед выполнением запроса
    await this.waitForInitialization()

    const endpoints = this.getEndpoints<T>()
    const endpoint = endpoints[endpointName as string]

    if (!endpoint) {
      throw new Error(`Эндпоинт ${String(endpointName)} не найден`)
    }

    try {
      // @ts-ignore
      return await endpoint.fetch(params, options) as R
    } catch (error) {
      apiLogger.error(`Ошибка запроса к ${String(endpointName)}`, { error, params })
      throw error
    }
  }

  /**
   * Переопределяем dispose для очистки ресурсов, включая обработчики событий и middleware
   */
  public override destroy(): void {
    // Вызываем родительский метод
    super.destroy()

    // Очищаем все обработчики событий
    this.eventSubscriber.destroy()

    // Очищаем middleware
    this.clearMiddleware()
  }

  public async init(): Promise<this> {
    await this.waitForInitialization()
    return this
  }

  // ==== middleware ====
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
  public getMiddlewareManager(): ApiMiddlewareManager {
    return this.middlewareManager
  }

  /**
   * Удаляет все middleware
   */
  public clearMiddleware(): void {
    this.middlewareManager.clear()
  }

  // ==== Подписки ====
  /**
   * Подписка на события конкретного эндпоинта с типизацией
   * @param endpointName Имя эндпоинта (с подсказками TypeScript)
   * @param listener Обработчик события с типизацией для конкретного эндпоинта
   * @returns Функция для отписки
   */
  public subscribeEndpoint<K extends keyof T>(endpointName: K, listener: (data: EndpointEventData<T, K, ApiEventData>) => void): Unsubscribe {
    return this.eventSubscriber.subscribeEndpoint(
      String(endpointName),
      listener as unknown as (data: ApiEventData) => void,
    )
  }

  /**
   * Подписка на определённый тип события с типизацией для всех эндпоинтов
   * @param eventType Тип события
   * @param listener Обработчик события с типизацией
   * @returns Функция для отписки
   */
  public subscribeEvent<E extends ApiEventData['type']>(eventType: E, listener: (data: Extract<ApiEventData, { type: E }>) => void): Unsubscribe {
    return this.eventSubscriber.subscribeEvent(eventType, listener)
  }

  /**
   * Подписка на события группы эндпоинтов по тегу
   * @param tag Тег группы эндпоинтов
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public subscribeTag(tag: string, listener: (data: ApiEventData) => void): Unsubscribe {
    return this.eventSubscriber.subscribeTag(tag, listener)
  }

  /**
   * Генерирует событие
   * @param eventType Тип события
   * @param data Данные события
   */
  private emitEvent(eventType: ApiEventType, data: ApiEventData): void {
    this.eventSubscriber.emit(eventType, data)
  }

  /**
   * Получает экземпляр менеджера событий
   * @returns Экземпляр менеджера событий
   */
  public getSubscriber(): ApiSubscriber {
    return this.eventSubscriber
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
