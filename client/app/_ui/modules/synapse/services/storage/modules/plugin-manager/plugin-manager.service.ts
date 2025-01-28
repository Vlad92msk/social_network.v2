import { IPluginExecutor } from './plugin-managers.interface'
import { IPluginManager } from '../../../core/core.interface'
import { IEventBus } from '../../../event-bus/event-bus.interface'
import { ILogger } from '../../../logger/logger.interface'
import { Logger } from '../../../logger/logger.service'
import { IStoragePlugin } from '../../storage.interface'

export abstract class StoragePluginManager implements IPluginManager<IStoragePlugin>, IPluginExecutor {
  readonly abstract name: string

  protected plugins: Map<string, IStoragePlugin> = new Map()

  protected readonly logger: ILogger

  protected readonly eventBus?: IEventBus

  constructor() {
    this.logger = new Logger()
  }

  // IPluginManager implementation
  async add(plugin: IStoragePlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      this.logger.warn(`Plugin ${plugin.name} already registered`)
      return
    }

    try {
      if (plugin.initialize) {
        await plugin.initialize()
      }

      this.plugins.set(plugin.name, plugin)
      await this.onPluginAdded(plugin)
    } catch (error) {
      this.logger.error(`Failed to register plugin ${plugin.name}`, error)
      throw error
    }
  }

  async remove(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (plugin) {
      if (plugin.destroy) {
        await plugin.destroy()
      }
      this.plugins.delete(name)
      await this.onPluginRemoved(name)
    }
  }

  get(name: string): IStoragePlugin | undefined {
    return this.plugins.get(name)
  }

  getAll(): IStoragePlugin[] {
    return Array.from(this.plugins.values())
  }

  // IPluginExecutor implementation
  executeBeforeSet<T>(key: string, value: T): T {
    let result = value
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onBeforeSet) {
        result = plugin.onBeforeSet(key, result)
      }
    }
    return result
  }

  executeAfterSet<T>(key: string, value: T): void {
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onAfterSet) {
        plugin.onAfterSet(key, value)
      }
    }
  }

  executeBeforeGet(key: string): string {
    let result = key
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onBeforeGet) {
        result = plugin.onBeforeGet(result)
      }
    }
    return result
  }

  executeAfterGet<T>(key: string, value: T | undefined): T | undefined {
    let result = value
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onAfterGet) {
        result = plugin.onAfterGet(key, result)
      }
    }
    return result
  }

  executeBeforeDelete(key: string): boolean {
    let canDelete = true
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onBeforeDelete) {
        canDelete = plugin.onBeforeDelete(key) && canDelete
      }
    }
    return canDelete
  }

  executeAfterDelete(key: string): void {
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onAfterDelete) {
        plugin.onAfterDelete(key)
      }
    }
  }

  executeOnClear(): void {
    for (const plugin of this.getPluginsToExecute()) {
      if (plugin.onClear) {
        plugin.onClear()
      }
    }
  }

  // BaseModule abstract methods implementation
  async destroy(): Promise<void> {
    await Promise.all(
      Array.from(this.plugins.values()).map((plugin) => plugin.destroy?.() ?? Promise.resolve()),
    )
    this.plugins.clear()
  }

  // Добавляем initialize из IPluginManager
  async initialize(): Promise<void> {
    // По умолчанию пустая реализация
  }

  protected abstract onPluginAdded(plugin: IStoragePlugin): Promise<void>

  protected abstract onPluginRemoved(name: string): Promise<void>

  protected abstract getPluginsToExecute(): IStoragePlugin[]
}
