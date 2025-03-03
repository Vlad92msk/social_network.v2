// eslint-disable-next-line max-classes-per-file
import { QueryStorage } from './components/query-storage'
import { CreateApiClientOptions, ExtractParamsType, ExtractResultType } from './types/api1.interface'
import { CreateEndpoint, EndpointConfig, Endpoint as EndpointType, RequestResponseModify, RequestState } from './types/endpoint.interface'
import { QueryOptions } from './types/query.interface'
import { apiLogger, createUniqueId } from './utils/api-helpers'
import { createHeaderContext } from './utils/createHeaderContext'
import { createPrepareHeaders, prepareRequestHeaders } from './utils/endpoint-headers'
import { fetchBaseQuery } from './utils/fetch-base-query'
import { getCacheableHeaders } from './utils/getCacheableHeaders'

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

  private readonly prepareHeaders: ReturnType<typeof createPrepareHeaders>

  constructor(
    private readonly name: string,
    private readonly queryStorage: QueryStorage,
    private readonly configCurrentEndpoint: EndpointConfig<RequestParams, RequestResponse>,
    private readonly cacheableHeaderKeys: CreateApiClientOptions['cacheableHeaderKeys'],
    private readonly globalCacheConfig: CreateApiClientOptions['cache'],
    private readonly baseQueryConfig: CreateApiClientOptions['baseQuery'],
  ) {
    // 1. Создаем функцию подготовки заголовков
    this.prepareHeaders = createPrepareHeaders(
      baseQueryConfig.prepareHeaders,
      configCurrentEndpoint.prepareHeaders,
    )
    // 2. Создаем функцию исполнения запроса
    this.queryFunction = fetchBaseQuery({
      baseUrl: baseQueryConfig.baseUrl,
      fetchFn: baseQueryConfig.fetchFn,
      timeout: baseQueryConfig.timeout,
      credentials: baseQueryConfig.credentials,
    })
    // 3. Создаем массив тех заголовков, которые нужно включить в ключ кэширования
    this.cacheableHeaders = [
      ...(cacheableHeaderKeys || []),
      ...(configCurrentEndpoint.includeCacheableHeaderKeys || []),
    ].filter((key) => !configCurrentEndpoint.excludeCacheableHeaderKeys?.includes(key))
  }

  public request(params: RequestParams, options?: QueryOptions): RequestResponseModify<RequestResponse> {
    // 1. Подготовка и инициализация запроса
    this.fetchCounts++
    const requestId = createUniqueId()
    const controller = new AbortController()
    const subscribers = new Set<(state: RequestState<RequestResponse, RequestParams>) => void>()
    const currentState: RequestState<RequestResponse, RequestParams> = {
      status: 'loading',
      requestParams: params,
      headers: new Headers(),
      error: undefined,
      data: undefined,
      fromCache: false,
    }
    const headerContext = createHeaderContext(
      {},
      options?.context || {},
    )

    // 2. Создаем основные функции для управления состоянием и уведомления подписчиков
    const notifySubscribers = (newState: Partial<RequestState<RequestResponse, RequestParams>>) => {
      // Обновляем состояние и вызываем всех подписчиков
      subscribers.forEach((cb) => {
        cb({ ...currentState, ...newState })
      })
    }

    // 3. Запускаем выполнение запроса
    const executeRequest = async () => {
      try {
        // Формируем заголовки
        const headers = await prepareRequestHeaders(this.prepareHeaders, headerContext)
        // Получаем только заголовки, которые нужны для кэширования
        const headersForCache = getCacheableHeaders(headers, this.cacheableHeaders)
        // Нужно ли кэшировать запрос
        const shouldCache = this.queryStorage.shouldCache(this.configCurrentEndpoint, options)
        // Создаем ключ кэша
        const [cacheKey, cacheParams] = this.queryStorage.createCacheKey(
          this.name,
          { ...params, ...headersForCache },
        )

        let result

        // 3.1 Проверяем кэш, если кэширование включено
        if (shouldCache) {
          result = await this.queryStorage.getCachedResult<RequestResponse>(cacheKey)
        }

        if (result) {
          notifySubscribers({
            fromCache: true,
            status: 'success',
            data: result.data,
            error: undefined,
            headers: result.headers,
            requestParams: params,
          })
        } else {
          // 3.2 Если кэш не используется или данных нет в кэше, выполняем запрос
          const requestDefinition = this.configCurrentEndpoint.request(params)
          const mergedOptions: QueryOptions = { ...options, signal: controller.signal }

          // 3.3 Выполняем запрос через queryFunction
          const response = await this.queryFunction<RequestResponse, RequestParams>(
            requestDefinition,
            mergedOptions,
            headers,
          )

          // 3.4 Обрабатываем результат
          if (response.ok && response.data) {
            // Если запрос успешен, сохраняем в кэш (если нужно)
            if (shouldCache) {
              const currentCacheConfig = this.queryStorage.createCacheConfig(this.configCurrentEndpoint)
              await this.queryStorage.setCachedResult(
                cacheKey,
                response,
                currentCacheConfig,
                cacheParams ?? {},
                this.configCurrentEndpoint.tags ?? [],
                this.configCurrentEndpoint.invalidatesTags ?? [],
              )
            }

            // Уведомляем об успешном результате
            notifySubscribers({
              status: 'success',
              data: response.data,
              headers: response.headers,
              requestParams: params,
              fromCache: false,
            })
          } else {
            // Уведомляем об ошибке
            notifySubscribers({
              status: 'error',
              error: response.error,
              data: undefined,
              headers: response.headers,
              requestParams: params,
              fromCache: false,
            })
          }
        }
      } catch (error) {
        // Обрабатываем ошибки и уведомляем подписчиков
        notifySubscribers({
          status: 'error',
          error: error as Error,
          data: undefined,
          headers: undefined,
          requestParams: params,
          fromCache: false,
        })
      }
    }

    // Запускаем запрос асинхронно
    executeRequest()

    // 4. Создаем промис для метода wait()
    const waitPromise = new Promise<RequestResponse>((resolve, reject) => {
      const unsubscribe = this.subscribe((state) => {
        if (state.status === 'success' && state.data) {
          unsubscribe()
          resolve(state.data)
        } else if (state.status === 'error' && state.error) {
          unsubscribe()
          reject(state.error)
        }
      })
    })

    // 5. Возвращаем объект с методами управления запросом
    return {
      id: requestId,

      // Подписка на изменения состояния
      subscribe: (listener) => {
        subscribers.add(listener)
        listener(currentState) // Вызываем сразу с текущим состоянием
        return () => subscribers.delete(listener)
      },

      // Ожидание результата запроса
      wait: () => waitPromise,

      abort: () => {},

      // Делегирование методов промиса
      then: (onfulfilled, onrejected) => waitPromise.then(onfulfilled, onrejected),
      catch: (onrejected) => waitPromise.catch(onrejected),
      finally: (onfinally) => waitPromise.finally(onfinally),
    }
  }

  public subscribe(cb) {
    return () => {}
  }

  public reset() {
    return Promise.resolve()
  }
}

export class ApiClient <T extends Record<string, EndpointConfig>> {
  /** Хранилище запросов */
  private queryStorage: QueryStorage

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
        endpointKey,
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
