import { StorageType } from '../../../storage.interface'
import { CacheRule } from '../../cache/cache-module.service'

// Контекст API для использования в prepareHeaders и других функциях
export interface ApiContext {
  requestParams?: any;
  getFromStorage: <T>(key: string) => T | undefined;
  getCookie: (name: string) => string | undefined;
  [key: string]: any; // Для дополнительных свойств
}

// Базовый запрос
export interface BaseQueryFn {
  <T = any, E = Error>(
    args: RequestDefinition,
    options?: RequestOptions,
    context?: ApiContext
  ): Promise<QueryResult<T, E>>
}

// Настройки fetch-запроса
export interface FetchBaseQueryArgs {
  baseUrl: string
  prepareHeaders?: (headers: Headers, context: ApiContext) => Headers
  timeout?: number
  fetchFn?: typeof fetch
  cacheableHeaderKeys?: string[] // Заголовки, которые влияют на кэш
}

// Определение запроса
export interface RequestDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  query?: Record<string, any>
  headers?: Record<string, string>
}

// Опции запроса
export interface RequestOptions {
  disableCache?: boolean
  signal?: AbortSignal
  timeout?: number
  headers?: Record<string, string>
  context?: Record<string, any>
  cacheableHeaderKeys?: string[] // Заголовки, которые влияют на кэш
}

// Результат запроса
export interface QueryResult<T = any, E = Error> {
  data?: T
  error?: E
  ok: boolean
  status: number
  statusText: string
  headers: Headers
  metadata?: CacheMetadata & {
    requestHeaders?: Record<string, string>
    cacheableHeaders?: Record<string, string> // Заголовки, которые влияют на кэш
  }
}

// Метаданные кэша - аналогичны структуре из CacheModule
export interface CacheMetadata {
  createdAt: number
  updatedAt: number
  expiresAt: number
  accessCount: number
  tags?: string[]
  createdAtDateTime: string
  updatedAtDateTime: string
  expiresAtDateTime: string
}

// Состояние эндпоинта
export interface EndpointState<TData = any> {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: TData
  error?: Error
  meta: {
    tags: string[]
    invalidatesTags: string[]
    cache: CacheConfig
  }
}

// Конфигурация эндпоинта
export interface EndpointConfig<TParams = any, TResult = any> {
  request: (params: TParams) => RequestDefinition
  cache?: CacheConfig
  tags?: string[]
  invalidatesTags?: string[]
  prepareHeaders?: (headers: Headers, context: ApiContext) => Headers
  cacheableHeaderKeys?: string[] // Заголовки, которые влияют на кэш
}

// Типизированная конфигурация эндпоинта
export interface TypedEndpointConfig<TParams = any, TResult = any> extends EndpointConfig<TParams, TResult> {
  response?: TResult; // Не используется в runtime, только для типизации
}

// Интерфейс эндпоинта
export interface Endpoint<TParams = any, TResult = any> {
  fetch: (params: TParams, options?: RequestOptions) => Promise<TResult>
  subscribe: (callback: (state: EndpointState<TResult>) => void) => VoidFunction
  getState: () => Promise<EndpointState<TResult>> // Асинхронный метод
  invalidate: () => Promise<void>
  reset: () => Promise<void>
  abort: () => void
  meta: {
    name: string
    tags: string[]
    invalidatesTags: string[]
    cache: CacheConfig
  }
}

// Билдер эндпоинтов
export interface EndpointBuilder {
  create<TParams, TResult>(
    config: Omit<EndpointConfig<TParams, TResult>, 'response'>
  ): TypedEndpointConfig<TParams, TResult>;
}

// Функция unsubscribe
export type Unsubscribe = () => void

// Настройки кэша
export interface CacheConfig {
  ttl?: number
  cleanup?: {
    enabled: boolean
    interval?: number
  }
  invalidateOnError?: boolean
  rules?: CacheRule[]
}

// Опции модуля запросов
export interface QueryModuleOptions {
  storageType: StorageType
  options?: {
    name?: string
    dbName?: string
    storeName?: string
    dbVersion?: number
  }
  cache?: CacheConfig
  baseQuery: BaseQueryFn | FetchBaseQueryArgs
  endpoints?: ((builder: EndpointBuilder) => Record<string, EndpointConfig>) | (() => Record<string, EndpointConfig>)
  cacheableHeaderKeys?: string[] // Глобальная настройка заголовков для кэша
}

// Типизированные опции модуля запросов
export interface TypedQueryModuleOptions<T extends Record<string, TypedEndpointConfig<any, any>>> extends Omit<QueryModuleOptions, 'endpoints'> {
  endpoints?: ((builder: EndpointBuilder) => T) | (() => T)
}

// Типы для получения параметров и результата из эндпоинта
export type ExtractParamsType<T> = T extends EndpointConfig<infer P, any> ? P : never
export type ExtractResultType<T> = T extends TypedEndpointConfig<any, infer R> ? R : T extends EndpointConfig<any, infer R> ? R : never

// Определение для типизированных endpoints
export interface EndpointsDefinition {
  [key: string]: TypedEndpointConfig<any, any>;
}

// Типизированные endpoints
export type TypedEndpoints<T extends Record<string, TypedEndpointConfig<any, any>>> = {
  [K in keyof T]: Endpoint<
    Parameters<T[K]['request']>[0],
    T[K]['response'] extends undefined ? any : T[K]['response']
  >;
}

// Утилиты для работы с заголовками

/**
 * Преобразует Headers в объект
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

/**
 * Фильтрует заголовки, оставляя только те, которые влияют на кэш
 */
export function filterCacheableHeaders(
  headers: Record<string, string>,
  cacheableKeys: string[] = [],
): Record<string, string> {
  if (!cacheableKeys?.length) return {}

  return Object.entries(headers)
    .filter(([key]) => {
      const lowerKey = key.toLowerCase()
      return cacheableKeys.includes(lowerKey) || cacheableKeys.includes(key)
    })
    .reduce((obj, [key, value]) => {
      obj[key] = value
      return obj
    }, {} as Record<string, string>)
}
