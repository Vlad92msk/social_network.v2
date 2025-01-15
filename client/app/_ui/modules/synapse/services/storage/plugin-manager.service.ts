import { IStoragePlugin } from './storage.interface'
import { Injectable } from '../../decorators'
import { IPluginManager } from '../core/core.interface'
import type { IDIContainer } from '../di-container/di-container.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StoragePluginManager implements IPluginManager<IStoragePlugin> {
  private plugins: Map<string, IStoragePlugin> = new Map()

  constructor(
    protected readonly container: IDIContainer,
    protected readonly logger: ILogger,
  ) {}

  add(plugin: IStoragePlugin): void {
    if (this.plugins.has(plugin.name)) {
      this.logger.warn(`Plugin ${plugin.name} already registered, skipping`)
      return
    }
    this.plugins.set(plugin.name, plugin)
  }

  remove(name: string): void {
    this.plugins.delete(name)
  }

  get(name: string): IStoragePlugin | undefined {
    return this.plugins.get(name)
  }

  getAll(): IStoragePlugin[] {
    return Array.from(this.plugins.values())
  }

  async initialize(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.initialize) {
        await plugin.initialize()
      }
    }
  }

  async destroy(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        await plugin.destroy()
      }
    }
  }

  // Методы для выполнения хуков плагинов
  executeBeforeSet<T>(key: string, value: T): T {
    let result = value
    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeSet) {
        result = plugin.onBeforeSet(key, result)
      }
    }
    return result
  }

  executeAfterSet<T>(key: string, value: T): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.onAfterSet) {
        plugin.onAfterSet(key, value)
      }
    }
  }

  executeBeforeGet(key: string): string {
    let result = key
    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeGet) {
        result = plugin.onBeforeGet(result)
      }
    }
    return result
  }

  executeAfterGet<T>(key: string, value: T | undefined): T | undefined {
    let result = value
    for (const plugin of this.plugins.values()) {
      if (plugin.onAfterGet) {
        result = plugin.onAfterGet(key, result)
      }
    }
    return result
  }

  executeBeforeDelete(key: string): boolean {
    let canDelete = true
    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeDelete) {
        canDelete = plugin.onBeforeDelete(key) && canDelete
      }
    }
    return canDelete
  }

  executeAfterDelete(key: string): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.onAfterDelete) {
        plugin.onAfterDelete(key)
      }
    }
  }

  executeOnClear(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.onClear) {
        plugin.onClear()
      }
    }
  }
}
