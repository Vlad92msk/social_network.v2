// Основные компоненты
export { ApiClient, createApiClient, createInitializedApiClient } from './components/api-client';
export { ApiModule } from './components/api-module';
export { Endpoint } from './components/endpoint';
export { RequestExecutor } from './components/request-executor';
export { CacheManager } from './components/cache-manager';
export { EventBus } from './components/event-bus';
export { MiddlewareManager } from './components/middleware-manager';
export { EndpointStateManager } from './components/endpoint-state-manager';
export { QueryStorage } from './components/query-storage';

// Типы и интерфейсы
export {
  ApiEventType,
  ApiEventData,
  ApiRequestStartEvent,
  ApiRequestSuccessEvent,
  ApiRequestErrorEvent,
  ApiRequestCancelEvent,
  ApiCacheHitEvent,
  ApiCacheMissEvent,
  ApiCacheSetEvent,
  ApiCacheInvalidateEvent,
} from './types/api-events.interface';

export {
  ApiMiddleware,
  EnhancedApiMiddleware,
  ApiMiddlewareOptions,
  MiddlewareRequestContext,
  MiddlewareResponseContext,
  MiddlewareErrorContext,
} from './types/api-middleware.interface';

export {
  ApiContext,
  ApiModuleOptions,
  BaseQueryFn,
  CacheConfig,
  CacheMetadata,
  CacheRule,
  CreateEndpoint,
  EndpointConfig,
  EndpointState,
  ExtractParamsType,
  ExtractResultType,
  FetchBaseQueryArgs,
  HttpMethod,
  QueryResult,
  RequestDefinition,
  RequestOptions,
  ResponseFormat,
  ResultMetadata,
  TypedApiModuleOptions,
  TypedEndpointConfig,
  Unsubscribe,
} from './types/api.interface';

// Утилиты
export { fetchBaseQuery } from './utils/fetch-base-query';
export {
  apiLogger,
  createUniqueId,
  deepClone,
  filterCacheableHeaders,
  headersToObject,
  isPromise,
  mergeArraysUnique,
  getCurrentISOTime,
  serializeError,
} from './utils/api-helpers';

export {
  getResponseFormatForMimeType,
  isFileResponse,
  extractFilenameFromHeaders,
  getFileMetadataFromHeaders,
  createBlobUrl,
  revokeBlobUrl,
  downloadBlob,
} from './utils/file-utils';

// Фабрики middleware
export { createLoggerMiddleware } from './middleware/logger.middleware';
export { createAuthMiddleware } from './middleware/auth.middleware';
export { createRetryMiddleware } from './middleware/retry.middleware';
export { createErrorHandlerMiddleware } from './middleware/error-handler.middleware';
export { createCacheControlMiddleware } from './middleware/cache-control.middleware';
