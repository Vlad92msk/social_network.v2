Давайте переработаем DI контейнер, чтобы сделать его независимым. Сначала создадим необходимые интерфейсы:

```typescript
// di-container/interfaces.ts

// Основные типы
export type ServiceIdentifier = string | symbol | Type<any>;
export type Type<T = any> = new (...args: any[]) => T;
export type ServiceFactory<T = any> = (...args: any[]) => T;

// Метаданные сервиса
export interface ServiceMetadata {
  id: ServiceIdentifier;
  dependencies: ServiceIdentifier[];
  singleton: boolean;
  tags: string[];
}

// Интерфейс для middleware
export interface ServiceMiddleware {
  before?(serviceId: ServiceIdentifier, ...args: any[]): any[];
  after?(serviceId: ServiceIdentifier, instance: any): any;
}

// Конфигурация контейнера
export interface ContainerConfig {
  defaultSingleton?: boolean;
  enableLogging?: boolean;
  middleware?: ServiceMiddleware[];
}

// Интерфейс для регистрации сервиса
export interface ServiceRegistration<T = any> {
  id: ServiceIdentifier;
  type?: Type<T>;
  factory?: ServiceFactory<T>;
  metadata?: Partial<ServiceMetadata>;
}

// Интерфейс для DI контейнера
export interface IDIContainer {
  register<T>(registration: ServiceRegistration<T>): void;
  get<T>(identifier: ServiceIdentifier): T;
  has(identifier: ServiceIdentifier): boolean;
  remove(identifier: ServiceIdentifier): boolean;
  clear(): void;
  use(middleware: ServiceMiddleware): void;
}
```

Теперь реализация:

```typescript
// di-container/container.ts
import 'reflect-metadata';
import { 
  IDIContainer, 
  ServiceIdentifier, 
  ServiceMetadata, 
  ServiceMiddleware,
  ServiceFactory,
  ServiceRegistration,
  Type,
  ContainerConfig
} from './interfaces';

export class DIContainer implements IDIContainer {
  private services: Map<ServiceIdentifier, any> = new Map();
  private factories: Map<ServiceIdentifier, ServiceFactory> = new Map();
  private metadata: Map<ServiceIdentifier, ServiceMetadata> = new Map();
  private middleware: ServiceMiddleware[] = [];
  private config: ContainerConfig;

  constructor(config: ContainerConfig = {}) {
    this.config = {
      defaultSingleton: true,
      enableLogging: false,
      middleware: [],
      ...config
    };
    
    if (this.config.middleware) {
      this.middleware.push(...this.config.middleware);
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[DIContainer] ${message}`, ...args);
    }
  }

  public register<T>({ id, type, factory, metadata = {} }: ServiceRegistration<T>): void {
    if (this.services.has(id)) {
      throw new Error(`Service "${id.toString()}" is already registered`);
    }

    const serviceMetadata: ServiceMetadata = {
      id,
      dependencies: this.resolveDependencies(type || factory),
      singleton: metadata.singleton ?? this.config.defaultSingleton ?? true,
      tags: metadata.tags ?? [],
    };

    this.metadata.set(id, serviceMetadata);

    if (type) {
      if (!this.isConstructor(type)) {
        throw new Error(`Invalid constructor for service "${id.toString()}"`);
      }
      this.factories.set(id, (...args: any[]) => new type(...args));
    } else if (factory) {
      this.factories.set(id, factory);
    } else {
      throw new Error(`Either type or factory must be provided for service "${id.toString()}"`);
    }

    this.log(`Registered service: ${id.toString()}`, serviceMetadata);
  }

  public get<T>(identifier: ServiceIdentifier): T {
    const metadata = this.metadata.get(identifier);
    if (!metadata) {
      throw new Error(`Service "${identifier.toString()}" not found`);
    }

    if (metadata.singleton && this.services.has(identifier)) {
      return this.services.get(identifier);
    }

    const factory = this.factories.get(identifier);
    if (!factory) {
      throw new Error(`Factory for "${identifier.toString()}" not found`);
    }

    try {
      const dependencies = metadata.dependencies.map(dep => this.get(dep));
      const args = this.applyMiddlewareBefore(identifier, dependencies);
      let instance = factory(...args);
      instance = this.applyMiddlewareAfter(identifier, instance);

      if (metadata.singleton) {
        this.services.set(identifier, instance);
      }

      return instance;
    } catch (error) {
      throw new Error(
        `Error creating instance of "${identifier.toString()}": ${error.message}`
      );
    }
  }

  public has(identifier: ServiceIdentifier): boolean {
    return this.metadata.has(identifier);
  }

  public remove(identifier: ServiceIdentifier): boolean {
    this.services.delete(identifier);
    this.factories.delete(identifier);
    return this.metadata.delete(identifier);
  }

  public clear(): void {
    this.services.clear();
    this.factories.clear();
    this.metadata.clear();
  }

  public use(middleware: ServiceMiddleware): void {
    this.middleware.push(middleware);
  }

  private isConstructor(func: unknown): func is Type {
    if (typeof func !== 'function') return false;
    try {
      Reflect.construct(String, [], func);
      return true;
    } catch {
      return false;
    }
  }

  private resolveDependencies(target: Type | ServiceFactory | undefined): ServiceIdentifier[] {
    if (!target) return [];
    if (typeof target === 'function' && this.isConstructor(target)) {
      return Reflect.getMetadata('design:paramtypes', target) || [];
    }
    return [];
  }

  private applyMiddlewareBefore(serviceId: ServiceIdentifier, args: any[]): any[] {
    return this.middleware.reduce(
      (processedArgs, middleware) => 
        middleware.before ? middleware.before(serviceId, ...processedArgs) : processedArgs,
      args
    );
  }

  private applyMiddlewareAfter(serviceId: ServiceIdentifier, result: any): any {
    return this.middleware.reduce(
      (processedResult, middleware) => 
        middleware.after ? middleware.after(serviceId, processedResult) : processedResult,
      result
    );
  }
}
```

Основные улучшения:

1. Удалена зависимость от LoggerService
2. Добавлена гибкая конфигурация
3. Улучшена типизация
4. Добавлены новые методы (has, remove, clear)
5. Улучшена обработка ошибок
6. Добавлена возможность включения/выключения логирования
7. Упрощена регистрация сервисов через единый интерфейс

Пример использования:

```typescript
// Пример использования
const container = new DIContainer({
  defaultSingleton: true,
  enableLogging: true,
  middleware: [
    {
      before: (id, ...args) => {
        console.log(`Creating service ${id.toString()}`);
        return args;
      }
    }
  ]
});

// Регистрация сервиса
container.register({
  id: 'UserService',
  type: UserService,
  metadata: {
    tags: ['user', 'auth'],
    singleton: true
  }
});

// Получение сервиса
const userService = container.get<UserService>('UserService');
```

Теперь контейнер можно использовать независимо в любом проекте. Хотите, чтобы я добавил какие-то дополнительные возможности?
