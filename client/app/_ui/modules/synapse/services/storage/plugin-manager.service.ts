import { IStoragePlugin } from './storage.interface'
import { Inject, Injectable } from '../../decorators'
import { BaseModule } from '../core/base.service'
import { IPluginManager } from '../core/core.interface'
import type { IDIContainer } from '../di-container/di-container.interface'

@Injectable()
export class StoragePluginManager extends BaseModule implements IPluginManager<IStoragePlugin> {
  readonly name = 'pluginManager'

  private plugins: Map<string, IStoragePlugin> = new Map()

  constructor(
    @Inject('container') container: IDIContainer,
  ) {
    super(container)
    // Создаем сегмент для событий плагинов
    this.eventBus.createSegment({
      name: 'storage-plugins',
      eventTypes: ['storage:plugin:added', 'storage:plugin:removed'],
      priority: 1000,
    })
  }

  protected async registerServices(): Promise<void> {
    // Нет необходимости регистрировать дополнительные сервисы
  }

  protected async setupEventHandlers(): Promise<void> {
    // Нет необходимости настраивать дополнительные обработчики
  }

  protected async cleanupResources(): Promise<void> {
    await Promise.all(
      Array.from(this.plugins.values()).map((plugin) => plugin.destroy?.() ?? Promise.resolve()),
    )
    this.plugins.clear()
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
