/**
 * Типы событий API
 */
export enum ApiEventType {
  /** Запрос начат */
  REQUEST_START = 'request:start',
  
  /** Запрос успешно завершен */
  REQUEST_SUCCESS = 'request:success',
  
  /** Запрос завершен с ошибкой */
  REQUEST_ERROR = 'request:error',
  
  /** Запрос отменен */
  REQUEST_CANCEL = 'request:cancel',
  
  /** Данные получены из кэша */
  CACHE_HIT = 'cache:hit',
  
  /** Данные не найдены в кэше */
  CACHE_MISS = 'cache:miss',
  
  /** Данные сохранены в кэш */
  CACHE_SET = 'cache:set',
  
  /** Кэш инвалидирован */
  CACHE_INVALIDATE = 'cache:invalidate'
}

/**
 * Базовый интерфейс события API
 */
export interface ApiEventBase {
  /** Тип события */
  type: ApiEventType;
  
  /** Имя эндпоинта */
  endpointName: string;
  
  /** Временная метка */
  timestamp: number;
  
  /** Дополнительные данные контекста */
  context?: Record<string, any>;
}

/**
 * Событие начала запроса
 */
export interface ApiRequestStartEvent extends ApiEventBase {
  type: ApiEventType.REQUEST_START;
  
  /** Параметры запроса */
  params: any;
  
  /** Заголовки запроса */
  headers?: Record<string, string>;
  
  /** Запрос будет выполнен с кэшированием */
  willCache?: boolean;
}

/**
 * Событие успешного завершения запроса
 */
export interface ApiRequestSuccessEvent extends ApiEventBase {
  type: ApiEventType.REQUEST_SUCCESS;
  
  /** Параметры запроса */
  params: any;
  
  /** Результат запроса */
  result: any;
  
  /** Данные были получены из кэша */
  fromCache?: boolean;
  
  /** Время выполнения в мс */
  duration?: number;
}

/**
 * Событие ошибки запроса
 */
export interface ApiRequestErrorEvent extends ApiEventBase {
  type: ApiEventType.REQUEST_ERROR;
  
  /** Параметры запроса */
  params: any;
  
  /** Ошибка запроса */
  error: Error;
  
  /** Время выполнения в мс */
  duration?: number;
}

/**
 * Событие отмены запроса
 */
export interface ApiRequestCancelEvent extends ApiEventBase {
  type: ApiEventType.REQUEST_CANCEL;
  
  /** Параметры запроса */
  params: any;
  
  /** Причина отмены */
  reason?: string;
}

/**
 * Событие попадания в кэш
 */
export interface ApiCacheHitEvent extends ApiEventBase {
  type: ApiEventType.CACHE_HIT;
  
  /** Параметры запроса */
  params: any;
  
  /** Ключ кэша */
  cacheKey: string;
  
  /** Результат из кэша */
  result: any;
}

/**
 * Событие отсутствия в кэше
 */
export interface ApiCacheMissEvent extends ApiEventBase {
  type: ApiEventType.CACHE_MISS;
  
  /** Параметры запроса */
  params: any;
  
  /** Ключ кэша */
  cacheKey: string;
}

/**
 * Событие сохранения в кэш
 */
export interface ApiCacheSetEvent extends ApiEventBase {
  type: ApiEventType.CACHE_SET;
  
  /** Параметры запроса */
  params: any;
  
  /** Ключ кэша */
  cacheKey: string;
  
  /** Время жизни кэша в мс */
  ttl: number;
}

/**
 * Событие инвалидации кэша
 */
export interface ApiCacheInvalidateEvent extends ApiEventBase {
  type: ApiEventType.CACHE_INVALIDATE;
  
  /** Теги, по которым произошла инвалидация */
  tags: string[];
  
  /** Количество удаленных записей */
  invalidatedCount: number;
}

/**
 * Объединение всех типов событий API
 */
export type ApiEventData = 
  | ApiRequestStartEvent
  | ApiRequestSuccessEvent
  | ApiRequestErrorEvent
  | ApiRequestCancelEvent
  | ApiCacheHitEvent
  | ApiCacheMissEvent
  | ApiCacheSetEvent
  | ApiCacheInvalidateEvent;