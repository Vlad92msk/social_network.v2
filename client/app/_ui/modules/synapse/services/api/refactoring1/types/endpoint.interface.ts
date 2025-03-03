import { ApiContext, CacheConfig, RequestDefinition } from './api1.interface'
import { QueryOptions, Unsubscribe } from './query.interface'

/**
 * Конфигурация эндпоинта
 */
export interface EndpointConfig<RequestParams extends Record<string, any>= any, RequestResult = any> {
  /** Функция для создания определения запроса из параметров */
  request: (params: RequestParams) => RequestDefinition<RequestParams>
  /** Настройки кэша для эндпоинта */
  cache?: CacheConfig
  /** Теги эндпоинта для группировки в кэше */
  tags?: string[]
  /** Теги, которые инвалидируются при успешном запросе */
  invalidatesTags?: string[]
  /** Функция для подготовки заголовков (дополняет глобальную) */
  prepareHeaders?: (headers: Headers, context: ApiContext<RequestParams>) => Promise<Headers>
  /** Добавить ключи заголовков, влияющие на кэш (Дополняет глобавльные ключи) */
  includeCacheableHeaderKeys?: string[]
  /** Исключить ключи заголовков, влияющие на кэш (Дополняет глобавльные ключи) */
  excludeCacheableHeaderKeys?: string[]
}

/**
 * Состояние эндпоинта
 * Содержит информацию о текущем состоянии запроса и данные
 */
export interface EndpointState {
  /** Статус запроса */
  status: 'idle' | 'loading' | 'success' | 'error'
  /** Ошибка (при неуспешном запросе) */
  error?: Error
  /** Количество вызовов */
  fetchCounts: number
  /** Метаданные эндпоинта */
  meta: Endpoint['meta']
  /** Какие заголовки участвовали в формировании ключа кэша (итоговые) */
  cacheableHeaders: string[]
}

/**
 * Состояние самого запроса
 */
export interface RequestState<ResponseData = any, RequestParams extends Record<string, any> = any, E = Error> {
  status: 'loading' | 'success' | 'error'
  data?: ResponseData
  error?: E
  headers: Headers
  requestParams?: RequestParams
  fromCache: boolean
}

/**
 * Дополнительные методы для request
 */
export interface RequestResponseModify<T> {
  id: string
  subscribe: (listener: (state: RequestState<T>) => void) => VoidFunction
  wait: () => Promise<T>

  /** Отменить запрос */
  abort: VoidFunction

  // Делаем объект "thenable" для поддержки await и .then()
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult>

  finally(onfinally?: (() => void) | null): Promise<T>
}

/**
 * Структура эндпоинта
 *
 * Эндпоинт - это всего лишь определение того6 как будет вызван метод
 * Эндпоинт может быть вызван в разных частях приложения с разными параметрами
 * По этому нет смысла хранить ответы так как они будут перезаписываться
 * метод subscribe больше нужен для мониторинга
 * meta - метаинформация по эндпоинту (то как он сконфигурирован)
 */
export interface Endpoint<RequestParams extends Record<string, any>= any, ResponseData = any> {
  /** Счетчик вызова конкретного эндпоинта в проекте */
  fetchCounts: number
  /** Выполнить запрос с параметрами */
  request: (params: RequestParams, options?: QueryOptions) => RequestResponseModify<ResponseData>
  /** Подписаться на изменения состояния эндпоинта (в основном для сбора статистики) */
  subscribe: (callback: (state: EndpointState) => void) => Unsubscribe
  /** Сбросить состояние */
  reset: () => Promise<void>
  /** Метаданные эндпоинта */
  meta: {
    /** Имя эндпоинта */
    name: string
    /** Теги эндпоинта */
    tags: string[]
    /** Теги, которые инвалидируются */
    invalidatesTags: string[]
    /** Настройки кэша */
    cache: CacheConfig
  }
}

/**
 * Функция для создания типизированных эндпоинтов
 */
export type CreateEndpoint = <RequestParams extends Record<string, any>, RequestResult>(
  config: EndpointConfig<RequestParams, RequestResult>
) => EndpointConfig<RequestParams, RequestResult>
