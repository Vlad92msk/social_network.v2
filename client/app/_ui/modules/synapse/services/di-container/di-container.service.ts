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

export class DIContainer implements IDIContainer {
  private services: Map<ServiceIdentifier, any> = new Map()

  private factories: Map<ServiceIdentifier, ServiceFactory> = new Map()

  private metadata: Map<ServiceIdentifier, ServiceMetadata> = new Map()

  private middleware: ServiceMiddleware[] = []

  private config: ContainerConfig

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
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[DIContainer] ${message}`, ...args)
    }
  }

  public register<T>({ id, type, factory, metadata = {} }: ServiceRegistration<T>): void {
    if (this.services.has(id)) {
      throw new Error(`Service "${id.toString()}" is already registered`)
    }

    const serviceMetadata: ServiceMetadata = {
      id,
      dependencies: this.resolveDependencies(type || factory),
      singleton: metadata.singleton ?? this.config.defaultSingleton ?? true,
      tags: metadata.tags ?? [],
    }

    this.metadata.set(id, serviceMetadata)

    if (type) {
      if (!this.isConstructor(type)) {
        throw new Error(`Invalid constructor for service "${id.toString()}"`)
      }
      this.factories.set(id, (...args: any[]) => new type(...args))
    } else if (factory) {
      this.factories.set(id, factory)
    } else {
      throw new Error(`Either type or factory must be provided for service "${id.toString()}"`)
    }

    this.log(`Registered service: ${id.toString()}`, serviceMetadata)
  }

  public get<T>(identifier: ServiceIdentifier): T {
    const metadata = this.metadata.get(identifier)
    if (!metadata) {
      throw new Error(`Service "${identifier.toString()}" not found`)
    }

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
}
