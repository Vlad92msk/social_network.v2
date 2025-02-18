// Основные классы
export { QueryModule } from './query.module'
export { QueryCacheManager } from './query-cache.manager'
export { fetchBaseQuery } from './fetch-base-query'

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
} from './query.interface'

// Утилиты для React
// export function useQuery<TParams, TResult>(
//   endpoint: Endpoint<TParams, TResult>,
//   params: TParams,
//   options?: RequestOptions,
// ): EndpointState<TResult> {
//   throw new Error('Not implemented - this is just a type export')
// }
