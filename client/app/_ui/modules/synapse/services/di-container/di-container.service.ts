// di-container/container.ts
import 'reflect-metadata'
import {
  ContainerConfig,
  IDIContainer,
  ServiceFactory,
  ServiceIdentifier,
  ServiceMetadata,
  ServiceMiddleware,
  ServiceRegistration,
  Type,
} from './di-container.interface'
import { INJECT_METADATA_KEY } from '../../decorators'

export class DIContainer implements IDIContainer {
  private services: Map<ServiceIdentifier, any> = new Map()

  private factories: Map<ServiceIdentifier, ServiceFactory> = new Map()

  private metadata: Map<ServiceIdentifier, ServiceMetadata> = new Map()

  private middleware: ServiceMiddleware[] = []

  private config: ContainerConfig

  private parent?: IDIContainer

  constructor(config: ContainerConfig = {}) {
    this.config = {
      defaultSingleton: true,
      enableLogging: false,
      middleware: [],
      ...config,
    }

    if (this.config.middleware) {
      this.middleware.push(...this.config.middleware)
    }

    if (this.config.parent) {
      this.parent = this.config.parent
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[DIContainer] ${message}`, ...args)
    }
  }

  public register<T>({ id, type, factory, instance, metadata = {} }: ServiceRegistration<T>): void {
    if (this.services.has(id)) {
      throw new Error(`Service "${id.toString()}" is already registered`)
    }

    const serviceMetadata: ServiceMetadata = {
      id,
      dependencies: instance ? [] : this.resolveDependencies(type || factory),
      singleton: metadata.singleton ?? this.config.defaultSingleton ?? true,
      tags: metadata.tags ?? [],
    }

    this.metadata.set(id, serviceMetadata)

    if (instance) {
      // Если передан готовый экземпляр, просто сохраняем его
      this.services.set(id, instance)
    } else if (type) {
      if (!this.isConstructor(type)) {
        throw new Error(`Invalid constructor for service "${id.toString()}"`)
      }
      this.factories.set(id, (...args: any[]) => new type(...args))
    } else if (factory) {
      this.factories.set(id, factory)
    } else {
      throw new Error(`Either type, factory or instance must be provided for service "${id.toString()}"`)
    }

    this.log(`Registered service: ${id.toString()}`, serviceMetadata)
  }

  public resolve<T>(target: Type<T>, params: any[] = []): T {
    // Получаем метаданные о зависимостях из декоратора
    const dependencies = Reflect.getMetadata('design:paramtypes', target) || []

    try {
      // Разрешаем зависимости
      const resolvedDeps = dependencies.map((dep: Type, index: number) => {
        // Если для этого индекса есть параметр в params, используем его
        if (params[index] !== undefined) {
          return params[index]
        }

        // Получаем токен внедрения, если он есть
        const injectionTokens = Reflect.getMetadata(INJECT_METADATA_KEY, target) || []
        const token = injectionTokens[index]

        if (token) {
          // Если есть токен, получаем сервис по нему
          return this.get(token)
        }

        // Иначе пытаемся создать экземпляр по типу
        return this.get(dep)
      })

      // Применяем middleware перед созданием
      const processedArgs = this.applyMiddlewareBefore(target.name, resolvedDeps)

      // Создаем экземпляр
      const instance = new target(...processedArgs)

      // Применяем middleware после создания
      return this.applyMiddlewareAfter(target.name, instance)
    } catch (error) {
      throw new Error(
        `Error resolving dependencies for "${target.name}": ${error.message}`,
      )
    }
  }

  public get<T>(identifier: ServiceIdentifier): T {
    // Сначала ищем в текущем контейнере
    if (this.metadata.has(identifier)) {
      return this.resolveService<T>(identifier)
    }

    // Если не нашли и есть родительский контейнер - ищем там
    if (this.parent?.has(identifier)) {
      return this.parent.get<T>(identifier)
    }

    throw new Error(`Service "${identifier.toString()}" not found`)
  }

  private resolveService<T>(identifier: ServiceIdentifier): T {
    const metadata = this.metadata.get(identifier)!

    if (metadata.singleton && this.services.has(identifier)) {
      return this.services.get(identifier)
    }

    const factory = this.factories.get(identifier)
    if (!factory) {
      throw new Error(`Factory for "${identifier.toString()}" not found`)
    }

    try {
      const dependencies = metadata.dependencies.map((dep) => this.get(dep))
      const args = this.applyMiddlewareBefore(identifier, dependencies)
      let instance = factory(...args)
      instance = this.applyMiddlewareAfter(identifier, instance)

      if (metadata.singleton) {
        this.services.set(identifier, instance)
      }

      return instance
    } catch (error) {
      throw new Error(
        `Error creating instance of "${identifier.toString()}": ${error.message}`,
      )
    }
  }

  public has(identifier: ServiceIdentifier): boolean {
    return this.metadata.has(identifier)
  }

  public remove(identifier: ServiceIdentifier): boolean {
    this.services.delete(identifier)
    this.factories.delete(identifier)
    return this.metadata.delete(identifier)
  }

  public clear(): void {
    this.services.clear()
    this.factories.clear()
    this.metadata.clear()
  }

  public use(middleware: ServiceMiddleware): void {
    this.middleware.push(middleware)
  }

  private isConstructor(func: unknown): func is Type {
    if (typeof func !== 'function') return false
    try {
      Reflect.construct(String, [], func)
      return true
    } catch {
      return false
    }
  }

  private resolveDependencies(target: Type | ServiceFactory | undefined): ServiceIdentifier[] {
    if (!target) return []
    if (typeof target === 'function' && this.isConstructor(target)) {
      return Reflect.getMetadata('design:paramtypes', target) || []
    }
    return []
  }

  private applyMiddlewareBefore(serviceId: ServiceIdentifier, args: any[]): any[] {
    return this.middleware.reduce(
      (processedArgs, middleware) => (middleware.before ? middleware.before(serviceId, ...processedArgs) : processedArgs),
      args,
    )
  }

  private applyMiddlewareAfter(serviceId: ServiceIdentifier, result: any): any {
    return this.middleware.reduce(
      (processedResult, middleware) => (middleware.after ? middleware.after(serviceId, processedResult) : processedResult),
      result,
    )
  }

  public getParent(): IDIContainer | undefined {
    return this.parent
  }

  public createChild(config: Partial<ContainerConfig> = {}): IDIContainer {
    return new DIContainer({
      ...this.config,
      ...config,
      parent: this,
    })
  }
}
