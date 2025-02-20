import { ApiModule } from './api-module'
import {
  Endpoint,
  EndpointBuilder,
  EndpointConfig,
  ExtractParamsType,
  ExtractResultType,
  RequestOptions,
  TypedApiModuleOptions,
  TypedEndpointConfig,
} from '../types/api.interface'
import { apiLogger, createApiContext, headersToObject } from '../utils/api-helpers'

/**
 * Типизированный клиент API с поддержкой билдера для эндпоинтов
 */
export class ApiClient<T extends Record<string, TypedEndpointConfig<any, any>>> extends ApiModule {
  /** Типизированные опции модуля */
  private _typedOptions: TypedApiModuleOptions<T>

  /** Глобальные настройки заголовков для кэша */
  private _globalCacheableHeaderKeys: string[]

  /**
   * Создает новый экземпляр типизированного API-клиента
   * @param options Типизированные настройки модуля
   */
  constructor(options: TypedApiModuleOptions<T>) {
    // Создаем копию опций для модификации
    const modifiedOptions = { ...options }

    // Сохраняем глобальные настройки заголовков для кэша
    const globalCacheableHeaderKeys = modifiedOptions.cacheableHeaderKeys || []

    // Создаем builder для инъекции в endpoints, если функция endpoints принимает builder
    if (typeof options.endpoints === 'function') {
      const originalEndpoints = options.endpoints
      // Проверяем количество параметров функции endpoints
      if (originalEndpoints.length > 0) {
        // Создаем билдер для endpoint'ов
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

        // Вызываем оригинальную функцию endpoints с builder
        const endpoints = originalEndpoints(builder)
        modifiedOptions.endpoints = () => endpoints
      }
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
  }

  /**
   * Переопределяем getEndpoints с улучшенной типизацией
   * @returns Типизированный объект эндпоинтов
   */
  public getEndpoints<U extends Record<string, EndpointConfig> = T>(): {
    [K in keyof U]: Endpoint<ExtractParamsType<U[K]>, ExtractResultType<U[K]>>;
    } {
    return super.getEndpoints<U>() as any
  }

  /**
   * Переопределяем создание эндпоинта для поддержки контекста и кэшируемых заголовков
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

    // Сохраняем оригинальную функцию fetch
    const originalFetch = endpoint.fetch

    // Получаем конфигурацию эндпоинта
    const endpointConfig = typeof nameOrConfig === 'string' ? config! : nameOrConfig

    // Получаем кэшируемые заголовки для эндпоинта
    const endpointCacheableHeaderKeys = endpointConfig.cacheableHeaderKeys

    // Переопределяем fetch для поддержки контекста
    endpoint.fetch = async (params: TParams, requestOptions: RequestOptions = {}): Promise<TResult> => {
      // Создаём контекст API
      const context = createApiContext(
        requestOptions.context || {},
        params
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

      // Вызываем оригинальный метод fetch с расширенными опциями
      return originalFetch.call(endpoint, params, enhancedOptions) as Promise<TResult>
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
   * Выполняет запрос к API с обработкой ошибок
   * @param endpointName Имя эндпоинта
   * @param params Параметры запроса
   * @param options Опции запроса
   * @returns Promise с результатом запроса
   */
  public async request<K extends keyof T, P extends ExtractParamsType<T[K]>, R extends ExtractResultType<T[K]>>(
    endpointName: K,
    params: P,
    options?: RequestOptions
  ): Promise<R> {
    const endpoints = this.getEndpoints<T>()
    const endpoint = endpoints[endpointName as string]

    if (!endpoint) {
      throw new Error(`Эндпоинт "${String(endpointName)}" не найден`)
    }

    try {
      //@ts-ignore
      return await endpoint.fetch(params, options) as R
    } catch (error) {
      apiLogger.error(`Ошибка запроса к ${String(endpointName)}`, { error, params })
      throw error
    }
  }
}
