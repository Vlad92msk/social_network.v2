import { CacheRule } from '../../storage/modules/cache/cache-module.service'
import { StorageType } from '../../storage/storage.interface'

/**
 * Стратегия хранения данных
 * Позволяет настроить поведение хранилища для разных типов данных
 */
export interface StorageStrategy {
  type: StorageType
  options?: {
    name?: string
    dbName?: string
    storeName?: string
    dbVersion?: number
    namespace?: string
  }
}

/**
 * Контекст API для использования в prepareHeaders и других функциях
 * Содержит вспомогательные методы и информацию о запросе
 */
export interface ApiContext {
  /** Параметры запроса */
  requestParams?: any;
  /** Получить значение из localStorage */
  getFromStorage: <T>(key: string) => T | undefined;
  /** Получить значение cookie */
  getCookie: (name: string) => string | undefined;
  /** Поддержка для дополнительных свойств */
  [key: string]: any;
}

/**
 * Базовая функция запроса
 * Абстракция над fetch или другими HTTP-клиентами
 */
export interface BaseQueryFn {
  <T = any, E = Error>(
    args: RequestDefinition,
    options?: RequestOptions,
    context?: ApiContext
  ): Promise<QueryResult<T, E>>
}

/**
 * Аргументы для создания fetch-запроса
 */
export interface FetchBaseQueryArgs {
  /** Базовый URL для всех запросов */
  baseUrl: string
  /** Функция для подготовки заголовков */
  prepareHeaders?: (headers: Headers, context: ApiContext) => Headers
  /** Таймаут запроса в миллисекундах */
  timeout?: number
  /** Пользовательская fetch-функция */
  fetchFn?: typeof fetch
  /** Ключи заголовков, которые влияют на кэш */
  cacheableHeaderKeys?: string[]
}

/**
 * Форматы ответа от сервера
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
 * Определение запроса
 * Содержит всю необходимую информацию для выполнения HTTP-запроса
 */
export interface RequestDefinition {
  /** Путь запроса (относительный или абсолютный URL) */
  path: string
  /** HTTP-метод */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** Тело запроса (автоматически сериализуется) */
  body?: any
  /** Параметры запроса (автоматически добавляются в URL) */
  query?: Record<string, any>
  /** HTTP-заголовки */
  headers?: Record<string, string>
  /** Формат ответа (по умолчанию json) */
  responseFormat?: ResponseFormat
  /** Имя файла для автоматического скачивания */
  fileName?: string
  /** Тип контента для автоматического скачивания */
  fileType?: string
}

/**
 * Опции для выполнения запроса
 */
export interface RequestOptions {
  /** Отключить кэширование для этого запроса */
  disableCache?: boolean
  /** Signal для отмены запроса */
  signal?: AbortSignal
  /** Таймаут в миллисекундах (переопределяет глобальный) */
  timeout?: number
  /** Дополнительные заголовки */
  headers?: Record<string, string>
  /** Пользовательский контекст */
  context?: Record<string, any>
  /** Ключи заголовков, влияющие на кэш (для конкретного запроса) */
  cacheableHeaderKeys?: string[]
  /** Формат ответа (переопределяет формат из RequestDefinition) */
  responseFormat?: ResponseFormat
  /** Название файла при скачивании (переопределяет fileName из RequestDefinition) */
  fileName?: string
  /** Тип файла при скачивании (переопределяет fileType из RequestDefinition) */
  fileType?: string
  /** Автоматически скачать файл после получения */
  downloadFile?: boolean
}

/**
 * Результат выполнения запроса
 */
export interface QueryResult<T = any, E = Error> {
  /** Данные ответа (при успешном запросе) */
  data?: T
  /** Ошибка (при неуспешном запросе) */
  error?: E
  /** Флаг успешности запроса */
  ok: boolean
  /** HTTP-статус */
  status: number
  /** Текстовое описание статуса */
  statusText: string
  /** Заголовки ответа */
  headers: Headers
  /** Метаданные запроса и кэша */
  metadata?: CacheMetadata & {
    /** Заголовки запроса */
    requestHeaders?: Record<string, string>
    /** Заголовки, влияющие на кэш */
    cacheableHeaders?: Record<string, string>
    /** Метаданные файла (если ответ - файл) */
    fileMetadata?: FileMetadata
  }
  /** Результат скачивания файла (если responseFormat - Blob или ArrayBuffer) */
  fileDownloadResult?: FileDownloadResult
}

/**
 * Метаданные кэша
 */
export interface CacheMetadata {
  /** Время создания записи (timestamp) */
  createdAt: number
  /** Время последнего обновления (timestamp) */
  updatedAt: number
  /** Время истечения срока действия (timestamp) */
  expiresAt: number
  /** Счетчик обращений к записи */
  accessCount: number
  /** Теги для инвалидации по группам */
  tags?: string[]
  /** Время создания в читаемом формате */
  createdAtDateTime: string
  /** Время обновления в читаемом формате */
  updatedAtDateTime: string
  /** Время истечения в читаемом формате */
  expiresAtDateTime: string
}

/**
 * Состояние эндпоинта
 * Содержит информацию о текущем состоянии запроса и данные
 */
export interface EndpointState<TData = any> {
  /** Статус запроса */
  status: 'idle' | 'loading' | 'success' | 'error'
  /** Данные (при успешном запросе) */
  data?: TData
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
  /** Функция для подготовки заголовков (переопределяет глобальную) */
  prepareHeaders?: (headers: Headers, context: ApiContext) => Headers
  /** Ключи заголовков, влияющие на кэш */
  cacheableHeaderKeys?: string[]
}

/**
 * Типизированная конфигурация эндпоинта
 * Расширяет базовую конфигурацию полем response для улучшения типизации
 */
export interface TypedEndpointConfig<TParams = any, TResult = any> extends EndpointConfig<TParams, TResult> {
  /** Поле для типизации (не используется в runtime) */
  response?: TResult;
}

/**
 * Интерфейс эндпоинта
 * Предоставляет методы для работы с конкретным API-эндпоинтом
 */
export interface Endpoint<TParams = any, TResult = any> {
  /** Выполнить запрос с параметрами */
  fetch: (params: TParams, options?: RequestOptions) => Promise<TResult>
  /** Подписаться на изменения состояния */
  subscribe: (callback: (state: EndpointState<TResult>) => void) => Unsubscribe
  /** Получить текущее состояние */
  getState: () => Promise<EndpointState<TResult>>
  /** Инвалидировать кэш по тегам */
  invalidate: () => Promise<void>
  /** Сбросить состояние */
  reset: () => Promise<void>
  /** Отменить текущий запрос */
  abort: () => void
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
 * Билдер эндпоинтов
 * Используется для создания типизированных эндпоинтов
 */
export interface EndpointBuilder {
  /** Создать типизированный эндпоинт */
  create<TParams, TResult>(
    config: Omit<EndpointConfig<TParams, TResult>, 'response'>
  ): TypedEndpointConfig<TParams, TResult>;
}

/** Функция для отписки от изменений состояния */
export type Unsubscribe = () => void

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
 * Опции для создания API-модуля
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
  /** Функция для создания эндпоинтов */
  endpoints?: ((builder: EndpointBuilder) => Record<string, EndpointConfig>) | (() => Record<string, EndpointConfig>)
  /** Глобальные заголовки, влияющие на кэш */
  cacheableHeaderKeys?: string[]
}

/**
 * Типизированные опции для создания API-модуля
 */
export interface TypedApiModuleOptions<T extends Record<string, TypedEndpointConfig<any, any>>> extends Omit<ApiModuleOptions, 'endpoints'> {
  /** Функция для создания типизированных эндпоинтов */
  endpoints?: ((builder: EndpointBuilder) => T) | (() => T)
}

/** Извлечение типа параметров из конфигурации эндпоинта */
export type ExtractParamsType<T> = T extends EndpointConfig<infer P, any> ? P : never

/** Извлечение типа результата из конфигурации эндпоинта */
export type ExtractResultType<T> = T extends TypedEndpointConfig<any, infer R> ? R : T extends EndpointConfig<any, infer R> ? R : never

/** Определение типизированных эндпоинтов */
export interface EndpointsDefinition {
  [key: string]: TypedEndpointConfig<any, any>;
}

/** Типизированные эндпоинты для использования */
export type TypedEndpoints<T extends Record<string, TypedEndpointConfig<any, any>>> = {
  [K in keyof T]: Endpoint<
    Parameters<T[K]['request']>[0],
    T[K]['response'] extends undefined ? any : T[K]['response']
  >;
}

/**
 * Метаданные для файла
 */
export interface FileMetadata {
  /** Имя файла */
  fileName: string
  /** Тип файла (MIME-тип) */
  fileType: string
  /** Размер файла в байтах */
  size?: number
  /** Дата создания файла */
  createdAt?: Date | string
  /** Дата изменения файла */
  updatedAt?: Date | string
}

/**
 * Результат скачивания файла
 */
export interface FileDownloadResult<T = Blob | ArrayBuffer> {
  /** Данные файла */
  data: T
  /** Метаданные файла */
  metadata: FileMetadata
  /** HTTP-статус */
  status: number
  /** Текст статуса */
  statusText: string
  /** Заголовки ответа */
  headers: Headers
  /** Успешна ли загрузка */
  ok: boolean
}
