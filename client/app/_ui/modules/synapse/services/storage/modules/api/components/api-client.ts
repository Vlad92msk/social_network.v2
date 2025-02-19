import { BaseApiClient } from './base-api-client'
import {
  ApiContext,
  Endpoint,
  EndpointBuilder,
  EndpointConfig,
  ExtractParamsType,
  ExtractResultType,
  headersToObject,
  RequestOptions,
  TypedEndpointConfig,
  TypedQueryModuleOptions,
} from '../types/api.interface'

/**
 * Типизированный клиент API с поддержкой билдера для эндпоинтов
 */
export class ApiClient<T extends Record<string, TypedEndpointConfig<any, any>>> extends BaseApiClient {
  private _typedOptions: TypedQueryModuleOptions<T>

  private _globalCacheableHeaderKeys: string[]

  constructor(options: TypedQueryModuleOptions<T>) {
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
          ): TypedEndpointConfig<TParams, TResult> => {
            // Создаем новый объект с полем response для правильного вывода типов
            return {
              ...config,
              response: null as unknown as TResult, // Используется только для типизации
            } as TypedEndpointConfig<TParams, TResult>;
          },
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
   * Переопределяем getEndpoints с типизацией для совместимости с базовым классом
   */
  public getEndpoints<U extends Record<string, EndpointConfig> = T>(): {
    [K in keyof U]: Endpoint<ExtractParamsType<U[K]>, ExtractResultType<U[K]>>;
    } {
    return super.getEndpoints<U>() as any
  }

  /**
   * Переопределяем создание эндпоинта для поддержки контекста и заголовков
   */
  public override async createEndpoint<TParams, TResult>(
    nameOrConfig: string | EndpointConfig<TParams, TResult>,
    config?: EndpointConfig<TParams, TResult>,
  ): Promise<Endpoint<TParams, TResult>> {
    const endpoint = await super.createEndpoint<TParams, TResult>(nameOrConfig, config)
    const originalFetch = endpoint.fetch

    // Получаем конфигурацию эндпоинта
    const endpointConfig = typeof nameOrConfig === 'string' ? config! : nameOrConfig

    // Получаем кэшируемые заголовки для эндпоинта
    const endpointCacheableHeaderKeys = endpointConfig.cacheableHeaderKeys

    // Переопределяем fetch для поддержки контекста
    endpoint.fetch = async (params: TParams, requestOptions: RequestOptions = {}): Promise<TResult> => {
      // Создаём контекст
      const context: ApiContext = {
        requestParams: params,
        getFromStorage: (key: string) => {
          const item = localStorage.getItem(key)
          return item ? JSON.parse(item) : undefined
        },
        getCookie: (name: string) => {
          const matches = document.cookie.match(
            new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`),
          )
          return matches ? decodeURIComponent(matches[1]) : undefined
        },
      }

      // Определяем, какие заголовки влияют на кэш
      // Приоритет: опции запроса > эндпоинт > глобальные
      const effectiveCacheableKeys = requestOptions.cacheableHeaderKeys
        || endpointCacheableHeaderKeys
        || this._globalCacheableHeaderKeys

      // Подготавливаем заголовки если есть prepareHeaders в эндпоинте
      if (endpointConfig.prepareHeaders) {
        const headers = new Headers(requestOptions.headers || {})
        const preparedHeaders = endpointConfig.prepareHeaders(headers, context)

        // Создаем новый объект опций, чтобы не модифицировать параметр функции
        const enhancedOptions: RequestOptions = {
          ...requestOptions,
          headers: headersToObject(preparedHeaders),
          context,
          cacheableHeaderKeys: effectiveCacheableKeys,
        }

        // Явно приводим результат к типу TResult
        return originalFetch(params, enhancedOptions) as Promise<TResult>
      }
      // Создаем новый объект опций с контекстом
      const enhancedOptions: RequestOptions = {
        ...requestOptions,
        context,
        cacheableHeaderKeys: effectiveCacheableKeys,
      }

      // Явно приводим результат к типу TResult
      return originalFetch(params, enhancedOptions) as Promise<TResult>
    }

    return endpoint
  }

  /**
   * Получает глобальные настройки кэшируемых заголовков
   */
  public getCacheableHeaderKeys(): string[] {
    return this._globalCacheableHeaderKeys
  }
}
