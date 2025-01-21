import { IStoragePlugin } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import { IPluginManager } from '../core/core.interface'
import type { IEventBus } from '../event-bus/event-bus.interface'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class StoragePluginManager implements IPluginManager<IStoragePlugin> {
  private plugins: Map<string, IStoragePlugin> = new Map()

  constructor(
    @Inject('eventBus') private readonly eventBus: IEventBus,
    @Inject('logger') private readonly logger: ILogger,
  ) {
    // Создаем сегмент для событий плагинов
    this.eventBus.createSegment('storage:plugins', {
      priority: 100,
      filters: [
        (event) => event.type.startsWith('storage:plugin:'),
      ],
    })
  }

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

      await this.eventBus.emit({
        type: 'storage:plugin:added',
        payload: { name: plugin.name },
      })
    } catch (error) {
      this.logger.error(`Failed to register plugin ${plugin.name}`, error)
      throw error
    }
  }

  async remove(name: string) {
    const plugin = this.plugins.get(name)
    if (plugin) {
      if (plugin.destroy) {
        await plugin.destroy()
      }
      this.plugins.delete(name)

      await this.eventBus.emit({
        type: 'storage:plugin:removed',
        payload: { name },
      })
    }
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
