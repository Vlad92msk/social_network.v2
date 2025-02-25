import { ApiEventType } from './api-events.interface';
import { ApiContext, QueryResult, RequestDefinition, RequestOptions } from './api.interface';

/**
 * Контекст middleware для запроса
 */
export interface MiddlewareRequestContext<TParams = any> extends ApiContext {
  /** Имя эндпоинта */
  endpointName: string;
  
  /** Параметры запроса */
  params: TParams;
  
  /** Оригинальный объект RequestDefinition */
  originalRequest: RequestDefinition;
  
  /** Оригинальные опции запроса */
  originalOptions?: RequestOptions;
  
  /** Метаданные эндпоинта */
  endpointMeta?: Record<string, any>;
}

/**
 * Контекст middleware для ответа
 */
export interface MiddlewareResponseContext<TParams = any, TResult = any> extends MiddlewareRequestContext<TParams> {
  /** Результат запроса */
  result: QueryResult<TResult>;
  
  /** Время выполнения запроса в мс */
  duration: number;
  
  /** Запрос был выполнен из кэша */
  fromCache: boolean;
}

/**
 * Контекст middleware для ошибки
 */
export interface MiddlewareErrorContext<TParams = any> extends MiddlewareRequestContext<TParams> {
  /** Ошибка */
  error: Error;
  
  /** Время выполнения запроса в мс */
  duration: number;
}

/**
 * Опции middleware
 */
export interface ApiMiddlewareOptions {
  /** Уникальное имя middleware */
  name: string;
  
  /** Привязка только к определенным эндпоинтам */
  endpoints?: string[];
  
  /** Привязка только к определенным типам событий */
  eventTypes?: ApiEventType[];
  
  /** Приоритет выполнения (чем выше, тем раньше) */
  priority?: number;
}

/**
 * Интерфейс для API middleware
 */
export interface ApiMiddleware {
  /** Опции middleware */
  options: ApiMiddlewareOptions;
  
  /**
   * Обработка запроса перед выполнением
   * @param request Определение запроса
   * @param options Опции запроса
   * @param context Контекст middleware
   * @returns Модифицированные параметры запроса или Promise
   */
  request?: (
    request: RequestDefinition,
    options: RequestOptions,
    context: MiddlewareRequestContext
  ) => Promise<{
    request: RequestDefinition,
    options: RequestOptions
  }> | {
    request: RequestDefinition,
    options: RequestOptions
  };
  
  /**
   * Обработка успешного ответа
   * @param result Результат запроса
   * @param context Контекст middleware для ответа
   * @returns Модифицированный результат или Promise
   */
  response?: <TResult = any>(
    result: QueryResult<TResult>,
    context: MiddlewareResponseContext
  ) => Promise<QueryResult<TResult>> | QueryResult<TResult>;
  
  /**
   * Обработка ошибки запроса
   * @param error Ошибка запроса
   * @param context Контекст middleware для ошибки
   * @returns Модифицированная ошибка, результат или Promise
   */
  error?: <TResult = any>(
    error: Error,
    context: MiddlewareErrorContext
  ) => Promise<Error | QueryResult<TResult>> | Error | QueryResult<TResult>;
}

/**
 * Расширенный интерфейс middleware с поддержкой событий
 */
export interface EnhancedApiMiddleware extends ApiMiddleware {
  /**
   * Обработка событий API
   * @param eventType Тип события
   * @param eventData Данные события
   * @returns Промис или void
   */
  onEvent?: (eventType: ApiEventType, eventData: any) => Promise<void> | void;
}