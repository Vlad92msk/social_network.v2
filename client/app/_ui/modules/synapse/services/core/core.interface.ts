/** Базовый интерфейс для всех модулей системы */
export interface IModule {
  /** Уникальное имя модуля */
  readonly name: string;

  /**
   * Инициализация модуля
   * Регистрирует сервисы, подписывается на события, инициализирует дочерние модули
   */
  initialize(): Promise<void>

  /** Освобождение ресурсов модуля */
  destroy(): Promise<void>
}

/**
 * Базовый интерфейс для плагинов
 * @description Определяет основные характеристики и методы жизненного цикла плагина
 */
export interface IPlugin {
  /** Уникальное имя плагина, используется для идентификации в менеджере */
  name: string

  /**
   * Асинхронная инициализация плагина
   * @description Вызывается при добавлении плагина в менеджер
   */
  initialize?(): Promise<void>

  /**
   * Асинхронное освобождение ресурсов
   * @description Вызывается при удалении плагина или остановке системы
   */
  destroy?(): Promise<void>
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

// Базовые типы для middleware
export type GetDefaultMiddleware = (options?: MiddlewareOptions) => Middleware[]
export type MiddlewareFunction = (getDefaultMiddleware: GetDefaultMiddleware) => Middleware[]
export type MiddlewareArray = Middleware[]
export type MiddlewareConfig = MiddlewareArray | MiddlewareFunction

export interface MiddlewareOptions {
  segments?: string[] // Явно указываем сегменты
  // Базовый интерфейс для всех опций middleware
  [key: string]: any
}

export type OperationType = 'get' | 'set' | 'delete' | 'clear' | 'keys';

export interface StorageContext<T = any> {
  type: OperationType;
  key?: string;
  value?: T;
  metadata?: Record<string, any>;
  segment?: string;
  baseOperation?: NextFunction;
}

export type NextFunction = (context: StorageContext) => Promise<any>;

export interface Middleware {
  (next: NextFunction): NextFunction;
  options?: MiddlewareOptions;
}

export type MiddlewareFactory<TOptions = MiddlewareOptions> =
  (options?: TOptions) => Middleware;
