// services/container.ts
import { Injectable } from '../decorators'
import { Logger } from './logger'
import {
  GlobalMiddleware,
  ServiceFactory,
  ServiceIdentifier,
  ServiceMetadata,
  Type,
} from '../types/container'

@Injectable()
export class ServiceContainer {
  private services: Map<ServiceIdentifier, any> = new Map()

  private factories: Map<ServiceIdentifier, ServiceFactory> = new Map()

  private metadata: Map<ServiceIdentifier, ServiceMetadata> = new Map()

  private middleware: GlobalMiddleware[] = []

  constructor(private logger: Logger) {}

  public register<T>(
    identifier: ServiceIdentifier,
    typeOrFactory: Type<T> | ServiceFactory<T>,
    metadata: Partial<ServiceMetadata> = {},
  ): void {
    if (this.services.has(identifier)) {
      throw new Error(`Service "${identifier.toString()}" is already registered`)
    }

    const serviceMetadata: ServiceMetadata = {
      id: identifier,
      dependencies: this.resolveDependencies(typeOrFactory),
      singleton: metadata.singleton ?? true,
      tags: metadata.tags ?? [],
    }

    this.metadata.set(identifier, serviceMetadata)

    if (this.isConstructor(typeOrFactory)) {
      const Constructor = typeOrFactory as Type<T>
      this.factories.set(identifier, (...args: any[]) => new Constructor(...args))
    } else {
      this.factories.set(identifier, typeOrFactory as ServiceFactory<T>)
    }

    this.logger.debug(`Registered service: ${identifier.toString()}`, serviceMetadata)
  }

  // Улучшенная проверка на конструктор
  private isConstructor(func: unknown): func is Type {
    if (typeof func !== 'function') return false

    try {
      // Проверяем, что функция может быть использована с 'new'
      Reflect.construct(String, [], func)
      // И что это действительно класс
      return /^class\s/.test(Function.prototype.toString.call(func))
    } catch (error) {
      return false
    }
  }

  public get<T>(identifier: ServiceIdentifier): T {
    const metadata = this.metadata.get(identifier)
    if (!metadata) {
      throw new Error(`Service "${identifier.toString()}" not found`)
    }

    // Проверяем синглтон
    if (metadata.singleton && this.services.has(identifier)) {
      return this.services.get(identifier)
    }

    // Получаем фабрику
    const factory = this.factories.get(identifier)
    if (!factory) {
      throw new Error(`Factory for "${identifier.toString()}" not found`)
    }

    // Разрешаем зависимости
    const dependencies = metadata.dependencies.map((dep) => this.get(dep))

    // Применяем middleware
    const args = this.applyMiddlewareBefore(identifier, dependencies)
    let instance = factory(...args)
    instance = this.applyMiddlewareAfter(identifier, instance)

    // Сохраняем синглтон
    if (metadata.singleton) {
      this.services.set(identifier, instance)
    }

    return instance
  }

  public use(middleware: GlobalMiddleware): void {
    this.middleware.push(middleware)
  }

  private isClass(func: any): boolean {
    return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func))
  }

  private resolveDependencies(target: Type | ServiceFactory): ServiceIdentifier[] {
    if (typeof target === 'function' && this.isClass(target)) {
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
}
