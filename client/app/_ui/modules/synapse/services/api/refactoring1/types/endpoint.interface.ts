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
  /** Метаданные эндпоинта */
  meta: {
    /** Теги эндпоинта для кэширования */
    tags: string[]
    /** Теги, которые инвалидируются при успешном запросе */
    invalidatesTags: string[]
    /** Настройки кэша эндпоинта */
    cache: CacheConfig
  }
}

/**
 * Состояние самого запроса
 */
export interface RequestState<ResponseData = any, E = Error> {
  status: 'loading' | 'success' | 'error'
  data?: ResponseData
  error?: E
  headers: Headers
}

/**
 * Дополнительные методы для fetch
 */
export interface RequestResponseModify<T> extends Promise<T>{
  id: string
  subscribe: (listener: (state: RequestState<T>) => void) => VoidFunction
  wait: () => Promise<T>
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
  /** Отменить текущий запрос */
  abort: VoidFunction
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
