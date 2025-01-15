// core.interface.ts

/** Базовый интерфейс для всех модулей системы */
export interface IModule {
  /** Уникальное имя модуля */
  readonly name: string;

  /** Массив имен модулей, от которых зависит данный модуль */
  readonly dependencies?: string[]

  /** Инициализация модуля */
  initialize(): Promise<void>

  /** Освобождение ресурсов модуля */
  destroy(): Promise<void>
}

/** Конфигурация модуля */
export interface ModuleConfig {
  /** Уникальное имя модуля */
  readonly name: string

  /** Массив имен модулей, от которых зависит данный модуль */
  readonly dependencies?: string[]

  /** Приоритет загрузки (чем выше, тем раньше загружается) */
  priority?: number
}

/** Состояние модуля */
export interface ModuleState {
  /** Статус модуля */
  status: 'pending' | 'initializing' | 'active' | 'error' | 'destroyed'

  /** Ошибка инициализации, если есть */
  error?: Error

  /** Время последней инициализации */
  initializedAt?: number

  /** Время последнего уничтожения */
  destroyedAt?: number
}

/** Интерфейс инициализатора модулей */
export interface IModuleInitializer {
  /** Регистрация нового модуля */
  registerModule(module: IModule): void

  /** Инициализация всех зарегистрированных модулей */
  initialize(): Promise<void>

  /** Уничтожение всех модулей */
  destroy(): Promise<void>

  /** Получение модуля по имени */
  getModule(name: string): IModule | undefined

  /** Проверка статуса инициализации модуля */
  isInitialized(name: string): boolean

  /** Получение графа зависимостей */
  getDependencyGraph(): Map<string, string[]>
}
