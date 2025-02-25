import { CacheManager } from './cache-manager'
import { EndpointStateManager } from './endpoint-state-manager'
import { EventBus } from './event-bus'
import { MiddlewareManager } from './middleware-manager'
import { RequestExecutor } from './request-executor'
import { ApiEventData } from '../types/api-events.interface'
import { EndpointConfig, EndpointState, RequestOptions } from '../types/api.interface'
import { apiLogger, createUniqueId } from '../utils/api-helpers'

/**
 * Класс эндпоинта для выполнения API-запросов
 */
export class Endpoint<TParams = any, TResult = any> {
  /** Имя эндпоинта */
  private readonly endpointName: string

  /** Конфигурация эндпоинта */
  private readonly config: EndpointConfig<TParams, TResult>

  /** Менеджер состояния эндпоинтов */
  private readonly stateManager: EndpointStateManager

  /** Исполнитель запросов */
  private readonly requestExecutor: RequestExecutor

  /** Менеджер событий */
  private readonly eventBus: EventBus

  /** Менеджер middleware */
  private readonly middlewareManager: MiddlewareManager

  /** Менеджер кэша */
  private readonly cacheManager: CacheManager | null

  /**
   * Создает экземпляр эндпоинта
   * @param params Параметры инициализации эндпоинта
   */
  private constructor(params: {
    endpointName: string
    config: EndpointConfig<TParams, TResult>
    stateManager: EndpointStateManager
    requestExecutor: RequestExecutor
    eventBus: EventBus
    middlewareManager: MiddlewareManager
    cacheManager: CacheManager | null
  }) {
    this.endpointName = params.endpointName
    this.config = params.config
    this.stateManager = params.stateManager
    this.requestExecutor = params.requestExecutor
    this.eventBus = params.eventBus
    this.middlewareManager = params.middlewareManager
    this.cacheManager = params.cacheManager
  }

  /**
   * Фабричный метод для создания экземпляра эндпоинта
   * @param params Параметры инициализации эндпоинта
   * @returns Экземпляр эндпоинта
   */
  public static async create<TParams, TResult>(params: {
    endpointName: string;
    endpointConfig: EndpointConfig<TParams, TResult>;
    stateManager: EndpointStateManager;
    requestExecutor: RequestExecutor;
    eventBus: EventBus;
    middlewareManager: MiddlewareManager;
    cacheManager: CacheManager | null;
  }): Promise<Endpoint<TParams, TResult>> {
    // Если имя не задано, генерируем уникальное
    const endpointName = params.endpointName || `endpoint_${createUniqueId()}`

    // Регистрируем теги эндпоинта в менеджере кэша
    if (params.cacheManager && params.endpointConfig.tags?.length) {
      // Сохраняем связь между эндпоинтом и тегами для возможной инвалидации
      if (typeof params.cacheManager.cacheOptions === 'object') {
        params.cacheManager.cacheOptions.tags = params.cacheManager.cacheOptions.tags || {}
        params.cacheManager.cacheOptions.tags[endpointName] = [...params.endpointConfig.tags]
      }
    }

    // Инициализируем состояние эндпоинта
    await params.stateManager.updateEndpointState(endpointName, {
      status: 'idle',
      meta: {
        cache: params.endpointConfig.cache,
        tags: params.endpointConfig.tags || [],
        invalidatesTags: params.endpointConfig.invalidatesTags || [],
      },
    })

    // Создаем экземпляр эндпоинта
    return new Endpoint<TParams, TResult>({
      endpointName,
      config: params.endpointConfig,
      stateManager: params.stateManager,
      requestExecutor: params.requestExecutor,
      eventBus: params.eventBus,
      middlewareManager: params.middlewareManager,
      cacheManager: params.cacheManager,
    })
  }

  /**
   * Выполняет запрос с параметрами
   * @param params Параметры запроса
   * @param options Опции запроса
   * @returns Результат запроса
   */
  public async fetch(params: TParams, options?: RequestOptions) {
    try {
      return await this.requestExecutor.executeRequest<TParams, TResult>(
        this.endpointName,
        this.config,
        params,
        options,
      )
    } catch (error) {
      apiLogger.error(`Ошибка запроса к ${this.endpointName}`, { error, params })
      throw error
    }
  }

  /**
   * Получает текущее состояние эндпоинта
   * @returns Состояние эндпоинта
   */
  public async getState() {
    return this.stateManager.getEndpointState<TResult>(this.endpointName)
  }

  /**
   * Сбрасывает состояние эндпоинта
   */
  public async resetState() {
    return this.stateManager.resetEndpointState(this.endpointName)
  }

  /**
   * Отменяет текущий запрос
   */
  public abort(): void {
    this.requestExecutor.abortRequest(this.endpointName)
  }

  /**
   * Инвалидирует кэш для этого эндпоинта
   */
  public async invalidateCache() {
    if (this.cacheManager && this.config.tags?.length) {
      await this.cacheManager.invalidateByTags(this.config.tags)
    }
  }

  /**
   * Подписка на изменения состояния эндпоинта
   * @param handler Обработчик изменения состояния
   * @returns Функция отписки
   */
  public subscribe(handler: (state: EndpointState<TResult>) => void) {
    return this.stateManager.subscribeToState<TResult>(this.endpointName, handler)
  }

  /**
   * Подписка на события эндпоинта
   * @param handler Обработчик события
   * @returns Функция отписки
   */
  public subscribeToEvents(handler: (data: ApiEventData) => void) {
    return this.eventBus.subscribeEndpoint(this.endpointName, handler)
  }

  /**
   * Получает имя эндпоинта
   * @returns Имя эндпоинта
   */
  public getName() {
    return this.endpointName
  }

  /**
   * Получает конфигурацию эндпоинта
   * @returns Конфигурация эндпоинта
   */
  public getConfig() {
    return this.config
  }
}
