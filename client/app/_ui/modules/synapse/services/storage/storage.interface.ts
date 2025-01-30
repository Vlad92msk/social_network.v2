import { IEventBus } from '@ui/modules/synapse/services/event-bus/event-bus.interface'
import { ILogger } from '@ui/modules/synapse/services/logger/logger.interface'
import { DefaultMiddlewareOptions } from '@ui/modules/synapse/services/storage/adapters/base-storage.service'
import { IPluginExecutor } from '@ui/modules/synapse/services/storage/modules/plugin-manager/plugin-managers.interface'
import { IPlugin, Middleware, MiddlewareArray, MiddlewareConfig, MiddlewareFunction, MiddlewareOptions } from '../core/core.interface'


/** Интерфейс для базовых операций хранилища */
export interface IStorage {
  /** Получение значения по ключу */
  get<T>(key: string): Promise<T | undefined>

  /** Установка значения по ключу */
  set<T>(key: string, value: T): Promise<void>

  /** Проверка наличия значения по ключу */
  has(key: string): Promise<boolean>

  /** Удаление значения по ключу */
  delete(key: string): Promise<void>

  /** Очистка всего хранилища */
  clear(): Promise<void>

  /** Получение всех ключей */
  keys(): Promise<string[]>

  subscribe(key: string, callback: (value: any) => void): () => void
}

export enum StorageEvents {
  STORAGE_UPDATE = 'storage:update',
  STORAGE_PATCH = 'storage:patch',
  STORAGE_SELECT = 'storage:select',
  STORAGE_CLEAR = 'storage:clear',
  STORAGE_ERROR = 'storage:error',
}

/**
 * Расширенный интерфейс плагина для хранилища
 * @description Определяет хуки для всех операций с данными
 */
export interface IStoragePlugin extends IPlugin {
  /**
   * Хук перед установкой значения
   * @returns Модифицированное значение для сохранения
   */
  onBeforeSet?<T>(key: string, value: T): T

  /**
   * Хук после установки значения
   * @description Можно использовать для логирования или синхронизации
   */
  onAfterSet?<T>(key: string, value: T): void

  /**
   * Хук перед получением значения
   * @returns Модифицированный ключ для получения данных
   */
  onBeforeGet?<T>(key: string): string

  /**
   * Хук после получения значения
   * @returns Модифицированное полученное значение
   */
  onAfterGet?<T>(key: string, value: T | undefined): T | undefined

  /**
   * Хук перед удалением значения
   * @returns false для отмены удаления
   */
  onBeforeDelete?(key: string): boolean

  /**
   * Хук после удаления значения
   * @description Можно использовать для очистки связанных данных
   */
  onAfterDelete?(key: string): void

  /**
   * Хук при очистке хранилища
   * @description Вызывается перед полной очисткой хранилища
   */
  onClear?(): void
}

export interface IndexDBConfig {
  /** Название базы данных для IndexedDB */
  dbName?: string
  /** Версия базы данных для IndexedDB */
  dbVersion?: number
  /** Название хранилища для IndexedDB */
  storeName?: string
}

// Базовый интерфейс с общими полями для всех конфигураций
export interface BaseStorageConfig {
  type?: 'memory' | 'indexDB' | 'localStorage'
  options?: IndexDBConfig
  plugins?: IStoragePlugin[]
}

// Конфигурация для обычных сегментов
export interface SegmentConfig<T> extends BaseStorageConfig {
  name: string
  initialState?: T
  middlewares?: MiddlewareArray
}

// Конфигурация для корневого сегмента
export interface RootSegmentConfig<T> extends Omit<SegmentConfig<T>, 'middlewares'> {
  middlewares?: MiddlewareFunction
}

// Объединенный тип для createSegment
export type CreateSegmentConfig<T> =
  | (SegmentConfig<T> & { isRoot?: false })
  | (RootSegmentConfig<T> & { isRoot: true })

// Опции для фабрики хранилища
export interface StorageFactoryOptions extends BaseStorageConfig {
  middlewares?: MiddlewareConfig
  isRoot?: boolean
}

/** Конфигурация хранилища */
export interface IStorageConfig {
  /** Начальное состояние */
  initialState?: Record<string, any>

  /** Тип хранилища */
  type?: 'memory' | 'indexDB' | 'localStorage'

  /** Опции для разных типов хранилища */
  options?: IndexDBConfig
  /** Массив плагинов */
  plugins?: IStoragePlugin[]

  /** Функция для получения middleware */
  middlewares?: (getDefaultMiddleware: (options?: MiddlewareOptions) => Middleware[]) => Middleware[]
}

export interface StorageDependencies {
  config: IStorageConfig
  pluginManager?: IPluginExecutor
  eventBus?: IEventBus
  logger?: ILogger
}

// Тип фабрики хранилища
export type StorageFactory = (options: StorageFactoryOptions) => Promise<IStorage>


// Конфигурация для корневого хранилища
export interface RootStorageConfig extends BaseStorageConfig {
  initialState?: Record<string, any>
  middlewares?: (getDefaultMiddleware: (options?: MiddlewareOptions) => Middleware[]) => Middleware[]
}


export type Selector<T, R> = (state: T) => R;
export type ResultFunction<Deps extends any[], R> = (...args: Deps) => R;
export type EqualityFn<T> = (a: T, b: T) => boolean;

export interface SelectorOptions<R> {
  equals?: EqualityFn<R>;
  name?: string;
}

// Интерфейс подписчика
export interface Subscriber<T> {
  // id: string // Для идентификации при отписке
  notify(value: T): Promise<void> // Метод получения обновлений
}

// Базовый интерфейс для всех сущностей, поддерживающих подписку
export interface Subscribable<T> {
  id?: string // Уникальный идентификатор
  subscribers: Set<Subscriber<T>> // Множество подписчиков
  notify(value: T): Promise<void> // Уведомление всех подписчиков
  subscribe(subscriber: Subscriber<T>): () => void// Добавление подписчика
  unsubscribe(subscriber: Subscriber<T>): void // Удаление подписчика
}

export interface SelectorAPI<R> {
  select: () => Promise<R>;
  subscribe: (listener: Subscriber<R | Promise<R>>) => () => void;
}

/** API для сегмента */
export interface IStorageSegment<T extends Record<string, any>> {
  // Выборка данных
  select: <R>(selector: (state: T) => R) => Promise<R>

  // Обновление состояния
  update: (updater: (state: T) => void) => Promise<void>

  // Работа с путями
  getByPath: <R>(path: string) => Promise<R | undefined>
  setByPath: <R>(path: string, value: R) => Promise<void>

  // Частичное обновление
  patch: (partialState: Partial<T>) => Promise<void>

  // Подписка на изменения
  subscribe: (listener: (state: T) => void) => () => void

  // Очистка сегмента
  clear: () => Promise<void>

  createSelector<R>(
    selector: Selector<T, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;
  createSelector<Deps extends any[], R>(
    dependencies: Array<Selector<T, Deps[number]> | SelectorAPI<Deps[number]>>,
    resultFn: ResultFunction<Deps, R>,
    options?: SelectorOptions<R>
  ): SelectorAPI<R>;
}

// 1. select - для одноразового получения данных
// await messengerSegment.select(state => state.unreadCount)
// Используйте когда:
// - Нужно просто получить значение один раз
// - Не нужно следить за изменениями
// - В обработчиках событий

// 2. subscribe - для отслеживания всех изменений в сегменте
// messengerSegment.subscribe(state => {
//   // Вызывается при ЛЮБОМ изменении в сегменте
// })
// Используйте когда:
// - Нужно реагировать на любые изменения в сегменте
// - Для общего мониторинга/логирования
// - Для синхронизации всего состояния

// 3. createSelector - для оптимизированной подписки на конкретные данные
// const unreadSelector = messengerSegment.createSelector(
//   state => state.unreadCount
// )
// unreadSelector.subscribe(count => {
//   // Вызывается ТОЛЬКО при изменении unreadCount
// })
// Используйте когда:
// - Нужно следить за конкретными данными
// - В React компонентах для оптимизации рендеринга
// - Для сложных вычислений на основе состояния
