import { EventEmitter } from 'events'
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
  Unsubscribe,
} from '../types/api.interface'
import { apiLogger, createApiContext, createUniqueId, headersToObject } from '../utils/api-helpers'

/**
 * Типы событий для подписки
 */
export type ApiEventType =
  | 'request:start' // Начало запроса
  | 'request:success' // Успешное завершение запроса
  | 'request:error' // Ошибка запроса
  | 'cache:hit' // Попадание в кэш
  | 'cache:miss' // Промах кэша
  | 'cache:invalidate'; // Инвалидация кэша

/**
 * Данные события запроса (базовый тип)
 */
export interface ApiEventDataBase {
  /** Имя эндпоинта */
  endpointName: string;
  /** Параметры запроса */
  params?: any;
  /** Уникальный ID запроса */
  requestId?: string;
  /** Теги (для инвалидации кэша) */
  tags?: string[];
  /** Контекст события (метаданные) */
  context?: {
    /** Тип события внутри контекста для маршрутизации */
    type: ApiEventType;
    /** Тег, если событие относится к определенному тегу */
    tag?: string;
    /** Дополнительные данные контекста */
    [key: string]: any;
  };
}

/**
 * Данные о начале запроса
 */
export interface RequestStartEventData extends ApiEventDataBase {
  type: 'request:start';
}

/**
 * Данные об успешном запросе
 */
export interface RequestSuccessEventData extends ApiEventDataBase {
  type: 'request:success';
  /** Результат запроса */
  result: any;
  /** Продолжительность запроса (мс) */
  duration: number;
  /** Флаг использования кэша */
  fromCache: boolean;
}

/**
 * Данные об ошибке запроса
 */
export interface RequestErrorEventData extends ApiEventDataBase {
  type: 'request:error';
  /** Ошибка запроса */
  error: Error;
  /** Продолжительность запроса (мс) */
  duration: number;
}

/**
 * Данные о попадании в кэш
 */
export interface CacheHitEventData extends ApiEventDataBase {
  type: 'cache:hit';
  /** Ключ кэша */
  cacheKey: string;
}

/**
 * Данные о промахе кэша
 */
export interface CacheMissEventData extends ApiEventDataBase {
  type: 'cache:miss';
  /** Ключ кэша */
  cacheKey: string;
}

/**
 * Данные об инвалидации кэша
 */
export interface CacheInvalidateEventData extends ApiEventDataBase {
  type: 'cache:invalidate';
  /** Теги для инвалидации */
  tags: string[];
  /** Затронутые ключи кэша */
  affectedKeys?: string[];
}

/**
 * Объединенный тип для всех событий API
 */
export type ApiEventData =
  | RequestStartEventData
  | RequestSuccessEventData
  | RequestErrorEventData
  | CacheHitEventData
  | CacheMissEventData
  | CacheInvalidateEventData;

/**
 * Базовый middleware для перехвата запросов
 */
export interface ApiMiddleware {
  /** Обработка перед запросом */
  before?: (context: ApiMiddlewareContext) => Promise<void> | void;
  /** Обработка после успешного запроса */
  after?: (context: ApiMiddlewareContext & { result: any }) => Promise<any> | any;
  /** Обработка при ошибке запроса */
  onError?: (context: ApiMiddlewareContext & { error: Error }) => Promise<void> | void;
}

/**
 * Контекст запроса для middleware
 */
export interface ApiMiddlewareContext {
  /** Имя эндпоинта */
  endpointName: string;
  /** Параметры запроса */
  params: any;
  /** Опции запроса */
  options: RequestOptions;
  /** Уникальный ID запроса */
  requestId: string;
  /** Оригинальная функция fetch */
  originalFetch: (...args: any[]) => Promise<any>;
  /** Ссылка на клиент API */
  client: ApiClient<any>;
}

/**
 * Помощник для извлечения типов параметров и результатов эндпоинтов
 */
type EndpointTypes<T> = {
  [K in keyof T]: {
    params: ExtractParamsType<T[K]>;
    result: ExtractResultType<T[K]>;
  }
};

/**
 * Помощник для создания типизированных событий для конкретного эндпоинта
 */
type EndpointEventData<
  T,
  K extends keyof T,
  E extends ApiEventData
> = Omit<E, 'params' | 'result'> & {
  endpointName: K;
  params: ExtractParamsType<T[K]>;
  result?: ExtractResultType<T[K]>;
  context?: {
    type: ApiEventType;
    tag?: string;
    [key: string]: any;
  };
};

/**
 * Улучшенный типизированный клиент API с типизированными подписками
 */
export class ApiClient<T extends Record<string, TypedEndpointConfig<any, any>>> extends ApiModule {
  /** Типизированные опции модуля */
  private _typedOptions: TypedApiModuleOptions<T>

  /** Глобальные настройки заголовков для кэша */
  private _globalCacheableHeaderKeys: string[]

  /** Эмиттер событий */
  private eventEmitter: EventEmitter

  /** Массив middleware */
  private middleware: ApiMiddleware[] = []

  /** Типы эндпоинтов для типизации */
  private endpointTypes!: EndpointTypes<T>

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

    // Инициализируем эмиттер событий
    this.eventEmitter = new EventEmitter()
    // Устанавливаем максимальное количество слушателей
    this.eventEmitter.setMaxListeners(50)

    // Инициализируем типы эндпоинтов для типизации
    this.endpointTypes = {} as EndpointTypes<T>
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
   * Подписка на события конкретного эндпоинта с типизацией
   * @param endpointName Имя эндпоинта (с подсказками TypeScript)
   * @param listener Обработчик события с типизацией для конкретного эндпоинта
   * @returns Функция для отписки
   */
  public onEndpoint<K extends keyof T>(
    endpointName: K,
    listener: (data: EndpointEventData<T, K, ApiEventData>) => void,
  ): Unsubscribe {
    const eventName = `endpoint:${String(endpointName)}`

    // Приведение типов для EventEmitter
    const typedListener = listener as unknown as (data: any) => void

    this.eventEmitter.on(eventName, typedListener)
    return () => {
      this.eventEmitter.off(eventName, typedListener)
    }
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
    // Приведение типов для EventEmitter
    const typedListener = listener as unknown as (data: any) => void

    this.eventEmitter.on(eventType, typedListener)
    return () => {
      this.eventEmitter.off(eventType, typedListener)
    }
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
    const eventName = `tag:${tag}`
    this.eventEmitter.on(eventName, listener)
    return () => {
      this.eventEmitter.off(eventName, listener)
    }
  }

  /**
   * Добавляет middleware для перехвата запросов
   * @param middleware Объект middleware
   * @returns this для цепочки вызовов
   */
  public use(middleware: ApiMiddleware): this {
    this.middleware.push(middleware)
    return this
  }

  /**
   * Удаляет все middleware
   */
  public clearMiddleware(): void {
    this.middleware = []
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
      const startEventData: RequestStartEventData = {
        type: 'request:start',
        endpointName: endpoint.meta.name,
        params,
        requestId,
      }

      // Генерируем события начала запроса
      this.emitEvent('request:start', startEventData)
      this.emitEvent(`endpoint:${endpoint.meta.name}`, {
        ...startEventData,
        context: { type: 'request:start' },
      })

      // Генерируем события для тегов эндпоинта
      if (endpoint.meta.tags && endpoint.meta.tags.length > 0) {
        for (const tag of endpoint.meta.tags) {
          this.emitEvent(`tag:${tag}`, {
            ...startEventData,
            context: { type: 'request:start', tag },
          })
        }
      }

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
        client: this,
      }

      try {
        // Выполняем before middleware
        for (const mw of this.middleware) {
          if (mw.before) {
            await mw.before(middlewareContext)
          }
        }

        // Вызываем оригинальный метод fetch с расширенными опциями
        let result = await originalFetch.call(endpoint, params, enhancedOptions) as TResult
        const duration = performance.now() - startTime

        // Выполняем after middleware в обратном порядке
        for (let i = this.middleware.length - 1; i >= 0; i--) {
          const mw = this.middleware[i]
          if (mw.after) {
            // Middleware может модифицировать результат
            result = await mw.after({
              ...middlewareContext,
              result,
            }) || result
          }
        }

        // Формируем данные о успешном запросе
        const successEventData: RequestSuccessEventData = {
          type: 'request:success',
          endpointName: endpoint.meta.name,
          params,
          result,
          duration,
          requestId,
          fromCache: false, // Можно добавить определение, если результат из кэша
        }

        // Генерируем события успешного запроса
        this.emitEvent('request:success', successEventData)
        this.emitEvent(`endpoint:${endpoint.meta.name}`, {
          ...successEventData,
          context: { type: 'request:success' },
        })

        // Генерируем события для тегов
        if (endpoint.meta.tags && endpoint.meta.tags.length > 0) {
          for (const tag of endpoint.meta.tags) {
            this.emitEvent(`tag:${tag}`, {
              ...successEventData,
              context: { type: 'request:success', tag },
            })
          }
        }

        return result
      } catch (error) {
        const duration = performance.now() - startTime

        // Выполняем onError middleware
        for (const mw of this.middleware) {
          if (mw.onError) {
            await mw.onError({
              ...middlewareContext,
              error: error as Error,
            })
          }
        }

        // Формируем данные об ошибке запроса
        const errorEventData: RequestErrorEventData = {
          type: 'request:error',
          endpointName: endpoint.meta.name,
          params,
          error: error as Error,
          duration,
          requestId,
        }

        // Генерируем события ошибки запроса
        this.emitEvent('request:error', errorEventData)
        this.emitEvent(`endpoint:${endpoint.meta.name}`, {
          ...errorEventData,
          context: { type: 'request:error' },
        })

        // Генерируем события для тегов
        if (endpoint.meta.tags && endpoint.meta.tags.length > 0) {
          for (const tag of endpoint.meta.tags) {
            this.emitEvent(`tag:${tag}`, {
              ...errorEventData,
              context: { type: 'request:error', tag },
            })
          }
        }

        throw error
      }
    }

    return endpoint
  }

  /**
   * Генерирует событие
   * @param eventType Тип события
   * @param data Данные события
   */
  private emitEvent(eventType: string, data: ApiEventData): void {
    try {
      this.eventEmitter.emit(eventType, data)
    } catch (error) {
      apiLogger.error(`Ошибка при генерации события ${eventType}`, error)
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
   * Переопределяем dispose для очистки ресурсов, включая обработчики событий
   */
  public override dispose(): void {
    // Вызываем родительский метод
    super.dispose()

    // Очищаем все обработчики событий
    this.eventEmitter.removeAllListeners()

    // Очищаем middleware
    this.clearMiddleware()
  }
}

// Пример создания типизированного API-клиента
// export const createApiClient = <T extends Record<string, TypedEndpointConfig<any, any>>>(
//   options: TypedApiModuleOptions<T>
// ): ApiClient<T> => {
//   return new ApiClient<T>(options);
// };

// Пример использования с типизацией:
// const pokemonApi = createApiClient({
//   // опции API
//   endpoints: (builder) => ({
//     getPokemonById: builder.create<number, PokemonDetails>({
//       // конфигурация эндпоинта
//     }),
//     // другие эндпоинты
//   })
// });
//
// // TypeScript будет предлагать автодополнение для имен эндпоинтов
// pokemonApi.onEndpoint('getPokemonById', (data) => {
//   // data.params будет типизирован как number
//   // data.result будет типизирован как PokemonDetails (для успешных запросов)
// });
//
// // TypeScript будет предлагать автодополнение для типов событий
// pokemonApi.onEvent('request:success', (data) => {
//   // data типизирован как RequestSuccessEventData
//   console.log(data.result, data.duration);
// });
