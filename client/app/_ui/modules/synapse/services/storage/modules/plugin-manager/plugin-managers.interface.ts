// plugin-managers.interface.ts


import { IPlugin } from '@ui/modules/synapse/services/core/core.interface'

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

/**
 * Интерфейс для управления плагинами определенного типа
 * @template T - Тип плагина, наследующий IPlugin
 */
export interface IPluginManager<T extends IPlugin> {
  /**
   * Асинхронное добавление нового плагина
   * @description Включает инициализацию и регистрацию событий
   */
  add(plugin: T): Promise<void>

  /**
   * Удаление плагина по имени
   * @description Не включает вызов destroy() плагина
   */
  remove(name: string): Promise<void>

  /** Получение плагина по имени */
  get(name: string): T | undefined

  /** Получение всех зарегистрированных плагинов */
  getAll(): T[]

  /** Асинхронная инициализация всех плагинов */
  initialize(): Promise<void>

  /** Асинхронное освобождение ресурсов всех плагинов */
  destroy(): Promise<void>
}

export interface IPluginExecutor {
  executeBeforeSet<T>(key: string, value: T): T
  executeAfterSet<T>(key: string, value: T): void
  executeBeforeGet(key: string): string
  executeAfterGet<T>(key: string, value: T | undefined): T | undefined
  executeBeforeDelete(key: string): boolean
  executeAfterDelete(key: string): void
  executeOnClear(): void
}

export interface IGlobalPluginManager extends IPluginExecutor {
  addGlobalPlugin(plugin: IStoragePlugin): Promise<void>
  removeGlobalPlugin(name: string): Promise<void>
}

export interface ISegmentPluginManager extends IPluginExecutor {
  addSegmentPlugin(plugin: IStoragePlugin): Promise<void>
  removeSegmentPlugin(name: string): Promise<void>
}
