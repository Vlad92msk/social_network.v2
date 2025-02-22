import { ApiEventManager } from './api-event-manager'
import { ApiMiddlewareManager } from './api-middleware-manager'
import { ApiModule } from './api-module'
import { ApiEventData, ApiEventType } from '../types/api-events.interface'
import { ApiMiddlewareContext, EnhancedApiMiddleware } from '../types/api-middleware.interface'
import {
  CreateEndpoint,
  Endpoint,
  EndpointConfig,
  ExtractParamsType,
  ExtractResultType,
  RequestOptions,
  TypedApiModuleOptions,
  TypedEndpointConfig,
  Unsubscribe,
} from '../types/api.interface'
import { apiLogger, createApiContext, createUniqueId, headersToObject } from '../utils/api-helpers'

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
  /** Типизированные опции модуля */
  private _typedOptions: TypedApiModuleOptions<T>

  /** Глобальные настройки заголовков для кэша */
  private _globalCacheableHeaderKeys: string[]

  /** Менеджер событий */
  private eventManager: ApiEventManager

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
    this._typedOptions = modifiedOptions
    this._globalCacheableHeaderKeys = globalCacheableHeaderKeys

    // Инициализируем менеджер событий
    this.eventManager = new ApiEventManager()

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
   * Подписка на события конкретного эндпоинта с типизацией
   * @param endpointName Имя эндпоинта (с подсказками TypeScript)
   * @param listener Обработчик события с типизацией для конкретного эндпоинта
   * @returns Функция для отписки
   */
  public onEndpoint<K extends keyof T>(
    endpointName: K,
    listener: (data: EndpointEventData<T, K, ApiEventData>) => void,
  ): Unsubscribe {
    return this.eventManager.onEndpoint(
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
  public onEvent<E extends ApiEventData['type']>(
    eventType: E,
    listener: (data: Extract<ApiEventData, { type: E }>) => void,
  ): Unsubscribe {
    return this.eventManager.onEvent(eventType, listener)
  }

  /**
   * Подписка на события группы эндпоинтов по тегу
   * @param tag Тег группы эндпоинтов
   * @param listener Обработчик события
   * @returns Функция для отписки
   */
  public onTag(
    tag: string,
    listener: (data: ApiEventData) => void,
  ): Unsubscribe {
    return this.eventManager.onTag(tag, listener)
  }

  /**
   * Генерирует событие
   * @param eventType Тип события
   * @param data Данные события
   */
  private emitEvent(eventType: ApiEventType, data: ApiEventData): void {
    this.eventManager.emit(eventType, data)
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
   * Удаляет все middleware
   */
  public clearMiddleware(): void {
    this.middlewareManager.clear()
  }

  /**
   * Переопределяем создание эндпоинта для поддержки контекста, событий и middleware
   * @param nameOrConfig Имя эндпоинта или его конфигурация
   * @param config Конфигурация эндпоинта (если первый параметр - имя)
   * @returns Promise с созданным эндпоинтом
   */
  public override async createEndpoint<TParams, TResult>(
    nameOrConfig: string | EndpointConfig<TParams, TResult>,
    config?: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    // Получаем базовую реализацию эндпоинта
    const endpoint = await super.createEndpoint<TParams, TResult>(nameOrConfig, config)

    // Сохраняем оригинальную функцию fetch и subscribe
    const originalFetch = endpoint.fetch
    const originalSubscribe = endpoint.subscribe

    // Получаем конфигурацию эндпоинта
    const endpointConfig = typeof nameOrConfig === 'string' ? config! : nameOrConfig

    // Получаем кэшируемые заголовки для эндпоинта
    const endpointCacheableHeaderKeys = endpointConfig.cacheableHeaderKeys

    // Переопределяем subscribe для эндпоинта, чтобы использовать нашу систему событий
    endpoint.subscribe = (callback): Unsubscribe => {
      // Используем как оригинальную подписку для состояния, так и нашу систему событий
      const unsubscribeOriginal = originalSubscribe.call(endpoint, callback)
      const unsubscribeEvents = this.onEndpoint(endpoint.meta.name as any, (data) => {
        // Передаем в callback только данные, которые связаны с изменением состояния
        if (data.context?.type === 'request:start'
          || data.context?.type === 'request:success'
          || data.context?.type === 'request:error') {
          // @ts-ignore
          callback(data)
        }
      })

      // Возвращаем функцию для отписки от обоих источников
      return () => {
        unsubscribeOriginal()
        unsubscribeEvents()
      }
    }

    // Переопределяем fetch для поддержки контекста, событий и middleware
    endpoint.fetch = async (params: TParams, requestOptions: RequestOptions = {}): Promise<TResult> => {
      // Создаём уникальный ID запроса для отслеживания
      const requestId = createUniqueId()
      const startTime = performance.now()

      // Формируем базовые данные события начала запроса
      const startEventData = {
        type: 'request:start' as const,
        endpointName: endpoint.meta.name,
        params,
        requestId,
      }

      // Генерируем события начала запроса через менеджер событий
      this.eventManager.emitGroupEvents(
        'request:start',
        startEventData,
        'request:start',
        endpoint.meta.tags,
      )

      // Создаём контекст API
      const context = createApiContext(
        requestOptions.context || {},
        params,
      )

      // Определяем, какие заголовки влияют на кэш
      // Приоритет: опции запроса > эндпоинт > глобальные
      const effectiveCacheableKeys = requestOptions.cacheableHeaderKeys
        || endpointCacheableHeaderKeys
        || this._globalCacheableHeaderKeys

      // Формируем новые опции запроса
      let enhancedOptions: RequestOptions = {
        ...requestOptions,
        context,
        cacheableHeaderKeys: effectiveCacheableKeys,
      }

      // Подготавливаем заголовки если есть prepareHeaders в эндпоинте
      if (endpointConfig.prepareHeaders && requestOptions.headers) {
        try {
          const headers = new Headers(requestOptions.headers || {})
          const preparedHeaders = endpointConfig.prepareHeaders(headers, context)

          // Добавляем подготовленные заголовки в опции
          enhancedOptions = {
            ...enhancedOptions,
            headers: headersToObject(preparedHeaders),
          }
        } catch (error) {
          apiLogger.warn(`Ошибка подготовки заголовков для ${endpoint.meta.name}`, error)
        }
      }

      // Создаем middleware контекст
      const middlewareContext: ApiMiddlewareContext = {
        endpointName: endpoint.meta.name,
        params,
        options: enhancedOptions,
        requestId,
        originalFetch: (p, o) => originalFetch.call(endpoint, p, o),
        client: this as any,
      }

      try {
        // Выполняем запрос через цепочку middleware
        const result = await this.middlewareManager.execute(middlewareContext) as TResult
        const duration = performance.now() - startTime

        // Формируем данные о успешном запросе
        const successEventData = {
          type: 'request:success' as const,
          endpointName: endpoint.meta.name,
          params,
          result,
          duration,
          requestId,
          fromCache: false, // Можно добавить определение, если результат из кэша
        }

        // Генерируем события успешного запроса через менеджер событий
        this.eventManager.emitGroupEvents(
          'request:success',
          successEventData,
          'request:success',
          endpoint.meta.tags,
        )

        return result
      } catch (error) {
        const duration = performance.now() - startTime

        // Формируем данные об ошибке запроса
        const errorEventData = {
          type: 'request:error' as const,
          endpointName: endpoint.meta.name,
          params,
          error: error as Error,
          duration,
          requestId,
        }

        // Генерируем события ошибки запроса через менеджер событий
        this.eventManager.emitGroupEvents(
          'request:error',
          errorEventData,
          'request:error',
          endpoint.meta.tags,
        )

        throw error
      }
    }

    return endpoint
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
    const endpoints = this.getEndpoints<T>()
    const endpoint = endpoints[endpointName as string]

    if (!endpoint) {
      throw new Error(`Эндпоинт "${String(endpointName)}" не найден`)
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
  public override dispose(): void {
    // Вызываем родительский метод
    super.dispose()

    // Очищаем все обработчики событий
    this.eventManager.dispose()

    // Очищаем middleware
    this.clearMiddleware()
  }

  /**
   * Получает экземпляр менеджера middleware
   * @returns Экземпляр менеджера middleware
   */
  public getMiddlewareManager(): ApiMiddlewareManager {
    return this.middlewareManager
  }

  /**
   * Получает экземпляр менеджера событий
   * @returns Экземпляр менеджера событий
   */
  public getEventManager(): ApiEventManager {
    return this.eventManager
  }
}

// Пример создания типизированного API-клиента
export const createApiClient = <T extends Record<string, TypedEndpointConfig<any, any>>>(
  options: TypedApiModuleOptions<T>,
): ApiClient<T> => new ApiClient<T>(options)
