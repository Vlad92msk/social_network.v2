/**
 * Интерфейсы ядра API-клиента
 */

import { StorageType } from '../../../storage/storage.interface'

/**
 * Тип запроса
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Поддерживаемые форматы ответа
 */
export enum ResponseFormat {
  /** JSON-объект (по умолчанию) */
  Json = 'json',
  /** Blob-объект для файлов */
  Blob = 'blob',
  /** ArrayBuffer для бинарных данных */
  ArrayBuffer = 'arrayBuffer',
  /** Текстовый формат */
  Text = 'text',
  /** FormData для форм */
  FormData = 'formData',
  /** Без преобразования - возвращает сырой ответ */
  Raw = 'raw'
}

/**
 * Контекст выполнения API-запроса
 */
export interface ApiContext {
  /**
   * Получение значения из хранилища
   */
  getFromStorage?: (key: string) => any;

  /**
   * Получение cookie значения
   */
  getCookie?: (name: string) => string | undefined;

  /**
   * Параметры запроса
   */
  requestParams?: RequestDefinition & RequestOptions;

  /**
   * Дополнительные данные контекста
   */
  [key: string]: any;
}

/**
 * Определение запроса
 */
export interface RequestDefinition {
  /**
   * Путь запроса (относительный или абсолютный URL)
   */
  path: string;

  /**
   * HTTP-метод запроса
   */
  method: HttpMethod;

  /**
   * Тело запроса
   */
  body?: any;

  /**
   * Параметры запроса
   */
  query?: Record<string, any>;

  /**
   * Заголовки запроса
   */
  headers?: Record<string, string>;

  /**
   * Формат ответа
   */
  responseFormat?: ResponseFormat;

  /** Имя файла для автоматического скачивания */
  fileName?: string
  /** Тип контента для автоматического скачивания */
  fileType?: string
}

/**
 * Опции выполнения запроса
 */
export interface RequestOptions {
  /**
   * Сигнал для отмены запроса
   */
  signal?: AbortSignal;

  /**
   * Таймаут запроса в миллисекундах
   */
  timeout?: number;

  /**
   * Дополнительные заголовки
   */
  headers?: Record<string, string>;

  /**
   * Дополнительный контекст запроса
   */
  context?: Record<string, any>;

  /**
   * Отключить кэш для этого запроса
   */
  disableCache?: boolean;

  /**
   * Принудительно включить кэш для запроса
   */
  enableCache?: boolean;

  /**
   * Ключи заголовков для включения в ключ кэша
   */
  cacheableHeaderKeys?: string[];

  /**
   * Формат ответа для этого запроса (переопределяет endpoint)
   */
  responseFormat?: ResponseFormat;

  /**
   * Функция для повторного выполнения запроса
   */
  retry?: <T = any, R = any>(params: T, options?: RequestOptions) => Promise<R>;
}

/**
 * Метаданные результата запроса
 */
export interface ResultMetadata {
  /**
   * Заголовки запроса
   */
  requestHeaders?: Record<string, string>;

  /**
   * Кэшируемые заголовки
   */
  cacheableHeaders?: Record<string, string>;

  /**
   * Метаданные файла, если это файловый ответ
   */
  fileMetadata?: any;

  /**
   * Ключи заголовков, которые влияют на кэш
   */
  cacheableHeaderKeys?: string[];
}

/**
 * Результат запроса
 */
export interface QueryResult<T = any, E extends Error = Error> {
  /**
   * Данные успешного ответа
   */
  data?: T;

  /**
   * Данные об ошибке
   */
  error?: E;

  /**
   * Флаг успешности запроса
   */
  ok: boolean;

  /**
   * HTTP-статус ответа
   */
  status: number;

  /**
   * Текстовое описание статуса
   */
  statusText: string;

  /**
   * Заголовки ответа
   */
  headers: Headers;

  /**
   * Метаданные запроса и ответа
   */
  metadata?: ResultMetadata;
}

/**
 * Аргументы для fetchBaseQuery
 */
export interface FetchBaseQueryArgs {
  /**
   * Базовый URL для запросов
   */
  baseUrl: string;

  /**
   * Функция для подготовки заголовков
   */
  prepareHeaders?: (headers: Headers, context: ApiContext) => Headers | Promise<Headers>;

  /**
   * Таймаут по умолчанию
   */
  timeout?: number;

  /**
   * Собственная реализация fetch
   */
  fetchFn?: typeof fetch;

  /**
   * Ключи заголовков для включения в ключ кэша
   */
  cacheableHeaderKeys?: string[];

  /**
   * Политика работы с учетными данными
   */
  credentials?: RequestCredentials;
}

/**
 * Тип базовой функции запроса
 */
export type BaseQueryFn = <T = any, E extends Error = Error>(
  args: RequestDefinition,
  options?: RequestOptions,
  context?: ApiContext
) => Promise<QueryResult<T, E>>;


/**
 * Правило кэширования
 */
export interface CacheRule {
  /**
   * Метод или паттерн метода
   */
  method: string;

  /**
   * Время жизни кэша в миллисекундах
   */
  ttl?: number;

  /**
   * Теги для группировки
   */
  tags?: string[];
}

/**
 * Настройки кэша
 * Может быть объектом с параметрами или boolean (true для кэширования с настройками по умолчанию, false для отключения)
 */
export type CacheConfig = boolean | {
  /** Время жизни кэша в миллисекундах */
  ttl?: number
  /** Настройки периодической очистки */
  cleanup?: {
    /** Включить периодическую очистку */
    enabled: boolean
    /** Интервал очистки в миллисекундах */
    interval?: number
  }
  /** Инвалидировать кэш при ошибке */
  invalidateOnError?: boolean
  /** Правила кэширования */
  rules?: CacheRule[]
}

/**
 * Тип для функции отписки от событий
 */
export type Unsubscribe = () => void;

/**
 * Тип для создания эндпоинта с типизацией
 */
export type CreateEndpoint = <TParams = any, TResult = any>(
  config: EndpointConfig<TParams, TResult>
) => EndpointConfig<TParams, TResult>;

/**
 * Извлечение типа параметров из конфигурации эндпоинта
 */
export type ExtractParamsType<T> = T extends EndpointConfig<infer P, any> ? P : never;

/**
 * Извлечение типа результата из конфигурации эндпоинта
 */
export type ExtractResultType<T> = T extends EndpointConfig<any, infer R> ? R : never;

/**
 * Конфигурация эндпоинта
 */
export interface EndpointConfig<TParams = any, TResult = any> {
  /** Функция для создания определения запроса из параметров */
  request: (params: TParams) => RequestDefinition
  /** Настройки кэша для эндпоинта */
  cache?: CacheConfig
  /** Теги эндпоинта для группировки в кэше */
  tags?: string[]
  /** Теги, которые инвалидируются при успешном запросе */
  invalidatesTags?: string[]
  /** Функция для подготовки заголовков (переопределяет глобальную), может быть асинхронной */
  prepareHeaders?: (headers: Headers, context: ApiContext) => Headers | Promise<Headers>
  /** Ключи заголовков, влияющие на кэш */
  cacheableHeaderKeys?: string[]
}

/**
 * Типизированная конфигурация эндпоинта
 */
export type TypedEndpointConfig<TParams = any, TResult = any> = EndpointConfig<TParams, TResult>

/**
 * Состояние эндпоинта
 */
export interface EndpointState<T = any> {
  /**
   * Статус запроса
   */
  status: 'idle' | 'loading' | 'success' | 'error';

  /**
   * Данные
   */
  data?: T;

  /**
   * Ошибка
   */
  error?: Error;

  /**
   * Метаданные
   */
  meta?: Record<string, any>;
}

/**
 * Опции API-модуля
 */
export interface ApiModuleOptions {
  /** Тип хранилища */
  storageType: StorageType
  /** Опции хранилища */
  options?: {
    /** Имя хранилища */
    name?: string
    /** Имя базы данных (для IndexedDB) */
    dbName?: string
    /** Имя хранилища (для IndexedDB) */
    storeName?: string
    /** Версия базы данных (для IndexedDB) */
    dbVersion?: number
  }
  /** Настройки кэша */
  cache?: CacheConfig
  /** Базовый запрос или его настройки */
  baseQuery: BaseQueryFn | FetchBaseQueryArgs
  /** Функция для создания эндпоинтов, может быть асинхронной */
  endpoints?: (create: CreateEndpoint) => Record<string, EndpointConfig> | Promise<Record<string, EndpointConfig>>
  /** Глобальные заголовки, влияющие на кэш */
  cacheableHeaderKeys?: string[]
}

/**
 * Опции типизированного API-модуля
 */
export interface TypedApiModuleOptions<T extends Record<string, TypedEndpointConfig<any, any>>> {
  /**
   * Тип хранилища
   */
  storageType?: StorageType;

  /**
   * Дополнительные настройки хранилища
   */
  options?: Record<string, any>;

  /**
   * Базовый запрос или конфигурация для fetchBaseQuery
   */
  baseQuery: BaseQueryFn | FetchBaseQueryArgs;

  /**
   * Конфигурация кэширования
   */
  cache?: boolean | CacheConfig;

  /**
   * Функция создания типизированных эндпоинтов или объект эндпоинтов
   */
  endpoints?:
    | ((create: CreateEndpoint) => T | Promise<T>)
    | T;

  /**
   * Ключи заголовков, которые влияют на кэш
   */
  cacheableHeaderKeys?: string[];
}
