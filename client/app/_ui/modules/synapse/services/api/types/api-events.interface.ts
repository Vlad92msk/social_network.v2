/**
 * Типы событий для подписки
 */
export type ApiEventType =
  | 'request:start' // Начало запроса
  | 'request:success' // Успешное завершение запроса
  | 'request:error' // Ошибка запроса
  | 'cache:hit' // Попадание в кэш
  | 'cache:miss' // Промах кэша
  | 'cache:invalidate' // Инвалидация кэша

/**
 * Данные события запроса (базовый тип)
 */
export interface ApiEventDataBase {
  /** Имя эндпоинта */
  endpointName: string
  /** Параметры запроса */
  params?: any
  /** Уникальный ID запроса */
  requestId?: string
  /** Теги (для инвалидации кэша) */
  tags?: string[]
  /** Контекст события (метаданные) */
  context?: {
    /** Тип события внутри контекста для маршрутизации */
    type: ApiEventType
    /** Тег, если событие относится к определенному тегу */
    tag?: string
    /** Дополнительные данные контекста */
    [key: string]: any
  }
}

/**
 * Данные о начале запроса
 */
export interface RequestStartEventData extends ApiEventDataBase {
  type: 'request:start'
}

/**
 * Данные об успешном запросе
 */
export interface RequestSuccessEventData extends ApiEventDataBase {
  type: 'request:success'
  /** Результат запроса */
  result: any
  /** Продолжительность запроса (мс) */
  duration: number
  /** Флаг использования кэша */
  fromCache: boolean
}

/**
 * Данные об ошибке запроса
 */
export interface RequestErrorEventData extends ApiEventDataBase {
  type: 'request:error'
  /** Ошибка запроса */
  error: Error
  /** Продолжительность запроса (мс) */
  duration: number
}

/**
 * Данные о попадании в кэш
 */
export interface CacheHitEventData extends ApiEventDataBase {
  type: 'cache:hit'
  /** Ключ кэша */
  cacheKey: string
}

/**
 * Данные о промахе кэша
 */
export interface CacheMissEventData extends ApiEventDataBase {
  type: 'cache:miss'
  /** Ключ кэша */
  cacheKey: string
}

/**
 * Данные об инвалидации кэша
 */
export interface CacheInvalidateEventData extends ApiEventDataBase {
  type: 'cache:invalidate'
  /** Теги для инвалидации */
  tags: string[]
  /** Затронутые ключи кэша */
  affectedKeys?: string[]
}

/**
 * Объединенный тип для всех событий API
 */
export type ApiEventData =
  | RequestStartEventData
  | RequestSuccessEventData
  | RequestErrorEventData
  | CacheHitEventData
  | CacheMissEventData
  | CacheInvalidateEventData

/** Функция для отписки от событий */
export type Unsubscribe = () => void
