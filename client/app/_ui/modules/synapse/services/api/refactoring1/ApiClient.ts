// eslint-disable-next-line max-classes-per-file
import { createPrepareHeaders } from './components/endpoint-headers'
import { QueryStorage } from './components/query-storage'
import { CreateApiClientOptions, ExtractParamsType, ExtractResultType } from './types/api1.interface'
import { CreateEndpoint, EndpointConfig, Endpoint as EndpointType, RequestResponseModify } from './types/endpoint.interface'
import { QueryOptions } from './types/query.interface'
import { apiLogger } from './utils/api-helpers'
import { fetchBaseQuery } from './utils/fetch-base-query'

class EndpointClass<RequestParams extends Record<string, any>, RequestResponse> implements EndpointType<RequestParams, RequestResponse> {
  fetchCounts: number = 0

  meta: EndpointType['meta'] = {
    cache: false,
    invalidatesTags: [],
    name: '',
    tags: [],
  }

  private readonly queryFunction: ReturnType<typeof fetchBaseQuery>

  private readonly cacheableHeaders: string[]

  constructor(
    private readonly queryStorage: any,
    private readonly configCurrentEndpoint: EndpointConfig<RequestParams, RequestResponse>,
    private readonly cacheableHeaderKeys: CreateApiClientOptions['cacheableHeaderKeys'],
    private readonly globalCacheConfig: CreateApiClientOptions['cache'],
    private readonly baseQueryConfig: CreateApiClientOptions['baseQuery'],
  ) {
    // 1. Объединяем настройки headers
    const prepareHeaders = createPrepareHeaders(
      this.baseQueryConfig.prepareHeaders,
      this.configCurrentEndpoint.prepareHeaders,
    )
    // 2. Создаем функцию исполнения запроса
    this.queryFunction = fetchBaseQuery({
      baseUrl: this.baseQueryConfig.baseUrl,
      fetchFn: this.baseQueryConfig.fetchFn,
      timeout: this.baseQueryConfig.timeout,
      credentials: this.baseQueryConfig.credentials,
      prepareHeaders,
    })
    // 3. Создаем массив тех заголовков, которые нужно включить в ключ кэширования
    this.cacheableHeaders = [
      ...(this.cacheableHeaderKeys || []),
      ...(this.configCurrentEndpoint.includeCacheableHeaderKeys || []),
    ].filter((key) => !this.configCurrentEndpoint.excludeCacheableHeaderKeys?.includes(key))
  }

  public request(params: RequestParams, options?: QueryOptions): RequestResponseModify<RequestResponse> {
    return ({
      id: '1',
      subscribe: (cb) => () => {},
      wait: () => new Promise(() => {}),
    })
  }

  public subscribe(cb) {
    return () => {}
  }

  public abort() {}

  public reset() {
    return Promise.resolve()
  }
}

export class ApiClient <T extends Record<string, EndpointConfig>> {
  /** Хранилище запросов */
  private queryStorage: any

  private readonly cacheableHeaderKeys: CreateApiClientOptions['cacheableHeaderKeys']

  private readonly globalCacheConfig: CreateApiClientOptions['cache']

  private readonly baseQueryConfig: CreateApiClientOptions['baseQuery']

  private readonly storageType: CreateApiClientOptions['storageType']

  private readonly storageOptions: CreateApiClientOptions['storageOptions']

  private readonly createEndpoints: CreateApiClientOptions['endpoints']

  /** Реестр эндпоинтов */
  private endpoints: Record<string, EndpointType<any, any>> = {}

  constructor(options: CreateApiClientOptions) {
    // Сохраняем переданные параметры
    this.cacheableHeaderKeys = options.cacheableHeaderKeys
    this.globalCacheConfig = options.cache
    this.baseQueryConfig = options.baseQuery
    this.storageType = options.storageType
    this.storageOptions = options.storageOptions
    this.createEndpoints = options.endpoints
  }

  public async init(): Promise<this> {
    // 1. Создаем кэшированное хранилище запросов
    this.queryStorage = await new QueryStorage(
      this.storageType,
      this.storageOptions,
      this.globalCacheConfig,
    )
      .initialize()

    // 2. Создаем эндпоинты
    await this.initializeEndpoints()

    return this
  }

  private async initializeEndpoints() {
    // Получаем конфигурацию будущих эндпоинтов
    const create: CreateEndpoint = <TParams extends Record<string, any>, TResult>(config: EndpointConfig<TParams, TResult>) => config
    // Создаем объект с конфигурациями для эндпоинтов
    const endpointsConfig = await this.createEndpoints?.(create) || {}

    // Создаем эндпоинты
    await Promise.all(Object.entries(endpointsConfig).map(([endpointKey, endpointConfig]) => (
      this.endpoints[endpointKey] = new EndpointClass(
        this.queryStorage,
        endpointConfig,
        this.cacheableHeaderKeys,
        this.globalCacheConfig,
        this.baseQueryConfig,
      )
    )))
  }

  /**
   * Получает все эндпоинты с улучшенной типизацией
   * @returns Типизированный объект эндпоинтов
   */
  public getEndpoints<U extends Record<string, EndpointConfig>>(): {
    [K in keyof U]: EndpointType<ExtractParamsType<U[K]>, ExtractResultType<U[K]>>
    } {
    return this.endpoints as any
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
    options?: QueryOptions,
  ): Promise<ExtractResultType<T[K]>> {
    const endpoints = this.getEndpoints<T>()
    const endpoint = endpoints[endpointName]

    if (!endpoint) {
      throw new Error(`Эндпоинт ${String(endpointName)} не найден`)
    }

    try {
      const stateRequest: RequestResponseModify<ExtractResultType<T[K]>> = endpoint.request(params, options)
      return await stateRequest.wait()
    } catch (error) {
      apiLogger.error(`Ошибка запроса к ${String(endpointName)}`, { error, params })
      throw error
    }
  }

  public async destroy() {
    await this.queryStorage.destroy()
  }
}
