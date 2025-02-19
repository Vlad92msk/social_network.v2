// Основные классы
export { QueryModule as BaseApiClient } from './api.module'
export { ApiCache } from './components/api-cache'
export { fetchBaseQuery } from './utils/fetch-base-query'
export { ApiClient } from './components/api-client'

// Функции-помощники
export { headersToObject, filterCacheableHeaders } from './types/api.interface'

// Интерфейсы
export type {
  BaseQueryFn,
  CacheConfig,
  Endpoint,
  EndpointConfig,
  EndpointState,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  QueryModuleOptions,
  QueryResult,
  RequestDefinition,
  RequestOptions,
  Unsubscribe,
  TypedEndpointConfig,
  TypedQueryModuleOptions,
  EndpointsDefinition,
  TypedEndpoints,
  ApiContext,
  EndpointBuilder
} from './types/api.interface'

// Утилиты для React
// export function useQuery<TParams, TResult>(
//   endpoint: Endpoint<TParams, TResult>,
//   params: TParams,
//   options?: RequestOptions,
// ): EndpointState<TResult> {
//   throw new Error('Not implemented - this is just a type export')
// }
