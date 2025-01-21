import { IPlugin, Middleware, MiddlewareOptions } from '../core/core.interface'


/** Интерфейс для базовых операций хранилища */
export interface IStorage {
  /** Получение значения по ключу */
  get<T>(key: string): Promise<T | undefined>

  /** Установка значения по ключу */
  set<T>(key: string, value: T): Promise<void>

  /** Проверка наличия значения по ключу */
  has(key: string): Promise<boolean> // Меняем на Promise для консистентности

  /** Удаление значения по ключу */
  delete(key: string): Promise<void>

  /** Очистка всего хранилища */
  clear(): Promise<void>

  /** Получение всех ключей */
  keys(): Promise<string[]>

  subscribe(key: string, callback: (value: any) => void): () => void
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

/** Конфигурация хранилища */
export interface IStorageConfig {
  /** Начальное состояние */
  initialState?: Record<string, any>

  /** Тип хранилища */
  type?: 'memory' | 'indexDB' | 'localStorage'

  /** Опции для разных типов хранилища */
  options?: {
    /** Название базы данных для IndexedDB */
    dbName?: string
    /** Версия базы данных для IndexedDB */
    dbVersion?: number
    /** Название хранилища для IndexedDB */
    storeName?: string
  }
  /** Массив плагинов */
  plugins?: IStoragePlugin[]

  /** Функция для получения middleware */
  middlewares?: (getDefaultMiddleware: (options?: MiddlewareOptions) => Middleware[]) => Middleware[]
}

export interface SegmentConfig<T> {
  name: string
  initialState?: T
  type?: IStorageConfig['type']
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
}
