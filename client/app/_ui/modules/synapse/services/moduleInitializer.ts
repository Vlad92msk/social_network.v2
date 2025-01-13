// services/moduleInitializer.ts
import { Inject, Injectable } from '../decorators'
import { Logger } from './logger'
import { IModule } from '../types/module'

@Injectable()
export class ModuleInitializer {
  private modules: Map<string, IModule> = new Map()

  private initialized: Set<string> = new Set()

  private initializing: Set<string> = new Set()

  constructor(
    @Inject('logger') private logger: Logger,
  ) {}

  public registerModule(module: IModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module "${module.name}" is already registered`)
    }

    this.modules.set(module.name, module)
    this.logger.debug(`Registered module: ${module.name}`)
  }

  public async initialize(): Promise<void> {
    const modules = Array.from(this.modules.values())

    // Сортируем модули с учетом зависимостей
    const sortedModules = this.topologicalSort(modules)

    // Инициализируем модули в правильном порядке
    for (const module of sortedModules) {
      await this.initializeModule(module)
    }
  }

  public async destroy(): Promise<void> {
    // Уничтожаем модули в обратном порядке
    const modules = Array.from(this.initialized).reverse()

    for (const moduleName of modules) {
      const module = this.modules.get(moduleName)
      if (module) {
        try {
          await module.destroy()
          this.initialized.delete(moduleName)
          this.logger.debug(`Destroyed module: ${moduleName}`)
        } catch (error) {
          this.logger.error(`Failed to destroy module ${moduleName}:`, error)
          throw error
        }
      }
    }
  }

  private async initializeModule(module: IModule): Promise<void> {
    if (this.initialized.has(module.name)) {
      return
    }

    if (this.initializing.has(module.name)) {
      throw new Error(`Circular dependency detected for module: ${module.name}`)
    }

    this.initializing.add(module.name)

    try {
      // Инициализируем зависимости
      if (module.dependencies) {
        for (const depName of module.dependencies) {
          const dep = this.modules.get(depName)
          if (!dep) {
            throw new Error(`Dependency "${depName}" not found for module "${module.name}"`)
          }
          await this.initializeModule(dep)
        }
      }

      // Инициализируем сам модуль
      await module.initialize()

      this.initialized.add(module.name)
      this.initializing.delete(module.name)

      this.logger.debug(`Initialized module: ${module.name}`)
    } catch (error) {
      this.initializing.delete(module.name)
      this.logger.error(`Failed to initialize module ${module.name}:`, error)
      throw error
    }
  }

  private topologicalSort(modules: IModule[]): IModule[] {
    const result: IModule[] = []
    const visited = new Set<string>()
    const temp = new Set<string>()

    const visit = (module: IModule) => {
      if (temp.has(module.name)) {
        throw new Error(`Circular dependency detected for module: ${module.name}`)
      }
      if (!visited.has(module.name)) {
        temp.add(module.name)

        const dependencies = module.dependencies || []
        for (const depName of dependencies) {
          const dep = this.modules.get(depName)
          if (!dep) {
            throw new Error(`Dependency "${depName}" not found for module "${module.name}"`)
          }
          visit(dep)
        }

        temp.delete(module.name)
        visited.add(module.name)
        result.push(module)
      }
    }

    modules.forEach((module) => {
      if (!visited.has(module.name)) {
        visit(module)
      }
    })

    return result
  }

  public getModule<T extends IModule>(name: string): T | undefined {
    return this.modules.get(name) as T
  }

  public isInitialized(name: string): boolean {
    return this.initialized.has(name)
  }

  public getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>()

    this.modules.forEach((module, name) => {
      graph.set(name, module.dependencies || [])
    })

    return graph
  }
}
