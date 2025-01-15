// module-initializer.ts

import { IModule, IModuleInitializer, ModuleState } from './core.interface'
import { Injectable } from '../../decorators'
import type { IDIContainer } from '../di-container/di-container.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class ModuleInitializer implements IModuleInitializer {
  private modules: Map<string, IModule> = new Map()

  private states: Map<string, ModuleState> = new Map()

  private initialized: Set<string> = new Set()

  constructor(
    private readonly logger: ILogger,
    private readonly container: IDIContainer,
  ) {}

  public registerModule(module: IModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module "${module.name}" is already registered`)
    }

    this.modules.set(module.name, module)
    this.states.set(module.name, { status: 'pending' })

    this.logger.debug(`Registered module: ${module.name}`, {
      dependencies: module.dependencies,
    })
  }

  public async initialize(): Promise<void> {
    this.logger.info('Starting modules initialization')

    try {
      // Получаем модули в порядке зависимостей
      const sortedModules = this.topologicalSort(Array.from(this.modules.values()))

      // Инициализируем каждый модуль
      for (const module of sortedModules) {
        await this.initializeModule(module)
      }

      this.logger.info('All modules initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize modules', error)
      throw error
    }
  }

  public async destroy(): Promise<void> {
    this.logger.info('Starting modules destruction')

    try {
      // Уничтожаем модули в обратном порядке
      const sortedModules = this.topologicalSort(Array.from(this.modules.values())).reverse()

      for (const module of sortedModules) {
        await this.destroyModule(module)
      }

      this.initialized.clear()
      this.logger.info('All modules destroyed successfully')
    } catch (error) {
      this.logger.error('Failed to destroy modules', error)
      throw error
    }
  }

  public getModule(name: string): IModule | undefined {
    return this.modules.get(name)
  }

  public isInitialized(name: string): boolean {
    return this.initialized.has(name)
  }

  public getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>()

    for (const [name, module] of this.modules) {
      graph.set(name, module.dependencies || [])
    }

    return graph
  }

  private async initializeModule(module: IModule): Promise<void> {
    const state = this.states.get(module.name)!

    // Проверяем что модуль еще не инициализирован
    if (this.initialized.has(module.name)) {
      return
    }

    // Проверяем циклические зависимости
    if (state.status === 'initializing') {
      throw new Error(`Circular dependency detected for module "${module.name}"`)
    }

    // Проверяем зависимости
    if (module.dependencies) {
      for (const dependency of module.dependencies) {
        if (!this.modules.has(dependency)) {
          throw new Error(
            `Module "${module.name}" depends on "${dependency}" which is not registered`,
          )
        }
        // Рекурсивно инициализируем зависимости
        await this.initializeModule(this.modules.get(dependency)!)
      }
    }

    try {
      state.status = 'initializing'
      await module.initialize()

      state.status = 'active'
      state.initializedAt = Date.now()
      this.initialized.add(module.name)

      this.logger.info(`Module "${module.name}" initialized`)
    } catch (error) {
      state.status = 'error'
      state.error = error

      this.logger.error(`Failed to initialize module "${module.name}"`, error)
      throw error
    }
  }

  private async destroyModule(module: IModule): Promise<void> {
    const state = this.states.get(module.name)!

    if (state.status !== 'active') {
      return
    }

    try {
      await module.destroy()

      state.status = 'destroyed'
      state.destroyedAt = Date.now()
      this.initialized.delete(module.name)

      this.logger.info(`Module "${module.name}" destroyed`)
    } catch (error) {
      state.status = 'error'
      state.error = error

      this.logger.error(`Failed to destroy module "${module.name}"`, error)
      throw error
    }
  }

  private topologicalSort(modules: IModule[]): IModule[] {
    const result: IModule[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    function visit(module: IModule) {
      if (visiting.has(module.name)) {
        throw new Error(`Circular dependency detected for module "${module.name}"`)
      }
      if (visited.has(module.name)) {
        return
      }

      visiting.add(module.name)

      if (module.dependencies) {
        for (const depName of module.dependencies) {
          const depModule = modules.find((m) => m.name === depName)
          if (!depModule) {
            throw new Error(
              `Module "${module.name}" depends on "${depName}" which is not registered`,
            )
          }
          visit(depModule)
        }
      }

      visiting.delete(module.name)
      visited.add(module.name)
      result.push(module)
    }

    modules.forEach(visit)
    return result
  }
}
