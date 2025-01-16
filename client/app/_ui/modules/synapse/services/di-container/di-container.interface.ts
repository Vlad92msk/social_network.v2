/** Идентификатор сервиса - может быть строкой, символом или типом */
export type ServiceIdentifier = string | symbol | Type<any>;

/** Тип конструктора для создания экземпляров класса */
export type Type<T = any> = new (...args: any[]) => T;

/** Фабричная функция для создания экземпляров сервиса */
export type ServiceFactory<T = any> = (...args: any[]) => T;

/** Метаданные сервиса */
export interface ServiceMetadata {
  /** Уникальный идентификатор сервиса */
  id: ServiceIdentifier;

  /** Массив идентификаторов сервисов, от которых зависит данный сервис */
  dependencies: ServiceIdentifier[];

  /** Флаг, указывающий является ли сервис синглтоном */
  singleton: boolean;

  /** Теги для группировки и поиска сервисов */
  tags: string[];
}

/** Middleware для перехвата создания и настройки сервисов */
export interface ServiceMiddleware {
  /**
   * Метод, вызываемый перед созданием экземпляра сервиса
   * @param serviceId - Идентификатор создаваемого сервиса
   * @param args - Аргументы, передаваемые в конструктор
   * @returns Модифицированные аргументы
   */
  before?(serviceId: ServiceIdentifier, ...args: any[]): any[];

  /**
   * Метод, вызываемый после создания экземпляра сервиса
   * @param serviceId - Идентификатор созданного сервиса
   * @param instance - Созданный экземпляр сервиса
   * @returns Модифицированный экземпляр
   */
  after?(serviceId: ServiceIdentifier, instance: any): any;
}

/** Конфигурация DI контейнера */
export interface ContainerConfig {
  /** Значение по умолчанию для флага singleton при регистрации сервисов */
  defaultSingleton?: boolean

  /** Включение/выключение логирования */
  enableLogging?: boolean

  /** Массив middleware, применяемых ко всем сервисам */
  middleware?: ServiceMiddleware[]

  /** Родительский контейнер для поиска сервисов */
  parent?: IDIContainer
}

/** Параметры для регистрации сервиса */
export interface ServiceRegistration<T = any> {
  /** Уникальный идентификатор сервиса */
  id: ServiceIdentifier

  /** Класс сервиса (если используется конструктор) */
  type?: Type<T>

  /** Фабричная функция (если не используется конструктор) */
  factory?: ServiceFactory<T>

  /** Дополнительные метаданные сервиса */
  metadata?: Partial<ServiceMetadata>

  /** возможность регистрации готового экземпляра */
  instance?: T
}

type Constructor<T> = new (...args: any[]) => T;

/** Основной интерфейс DI контейнера */
export interface IDIContainer {
  /**
   * Регистрация нового сервиса
   * @param registration - Параметры регистрации
   */
  register<T>(registration: ServiceRegistration<T>): void;

  /**
   * Получение экземпляра сервиса
   * @param identifier - Идентификатор сервиса
   * @returns Экземпляр сервиса
   */
  get<T>(identifier: ServiceIdentifier): T;

  /**
   * Проверка наличия сервиса в контейнере
   * @param identifier - Идентификатор сервиса
   * @returns true если сервис зарегистрирован
   */
  has(identifier: ServiceIdentifier): boolean;

  /**
   * Удаление сервиса из контейнера
   * @param identifier - Идентификатор сервиса
   * @returns true если сервис был успешно удален
   */
  remove(identifier: ServiceIdentifier): boolean;

  /**
   * Очистка контейнера от всех зарегистрированных сервисов
   */
  clear(): void;

  /**
   * Добавление нового middleware
   * @param middleware - Объект middleware
   */
  use(middleware: ServiceMiddleware): void;

  /**
   * Создает экземпляр класса, разрешая его зависимости
   * @param target - Класс для создания
   * @param params - Дополнительные параметры конструктора
   */
  resolve<T>(target: Constructor<T>, params?: any[]): T;
}

// register - это как "регистрация в телефонной книге". Мы говорим DI-контейнеру: "Вот сервис logger, вот eventBus - запомни их, они могут понадобиться другим".
// resolve - это когда мы говорим: "Создай мне экземпляр CorePluginManager и подставь в его конструктор все нужные зависимости из тех, что ты знаешь (которые были зарегистрированы через register)"
