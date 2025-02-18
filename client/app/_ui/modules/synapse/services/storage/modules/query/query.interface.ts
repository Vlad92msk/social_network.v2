import { IndexedDBConfig } from '../../adapters/indexed-DB.service'
import { StorageConfig, StorageType } from '../../storage.interface'
import { CacheRule } from '../cache/cache-module.service'

// Базовый запрос
export interface BaseQueryFn {
  <T = any, E = Error>(
    args: RequestDefinition,
    options?: RequestOptions
  ): Promise<QueryResult<T, E>>
}

// Настройки fetch-запроса
export interface FetchBaseQueryArgs {
  baseUrl: string
  prepareHeaders?: (headers: Headers, api: { getToken?: () => string }) => Headers
  timeout?: number
  fetchFn?: typeof fetch
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
}

// Результат запроса
export interface QueryResult<T = any, E = Error> {
  data?: T
  error?: E
  ok: boolean
  status: number
  statusText: string
  headers: Headers
  metadata?: CacheMetadata
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
}

// Интерфейс эндпоинта
export interface Endpoint<TParams = any, TResult = any> {
  fetch: (params: TParams, options?: RequestOptions) => Promise<TResult>
  subscribe: (callback: (state: EndpointState<TResult>) => void) => VoidFunction
  getState: () => EndpointState<TResult>
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
  endpoints?: () => Record<string, EndpointConfig>
}

// Типы для получения параметров и результата из эндпоинта
export type ExtractParamsType<T> = T extends EndpointConfig<infer P, any> ? P : never
export type ExtractResultType<T> = T extends EndpointConfig<any, infer R> ? R : never
