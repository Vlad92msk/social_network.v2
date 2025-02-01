import { IPluginExecutor, IPluginManager, IStoragePlugin } from './plugin-managers.interface'
import { ILogger } from '../../storage.interface'

export class StoragePluginManager implements IPluginManager<IStoragePlugin>, IPluginExecutor {
  private plugins = new Map<string, IStoragePlugin>()

  constructor(
    protected readonly parentExecutor?: IPluginExecutor,
    protected readonly logger?: ILogger,
  ) {}

  // IPluginManager implementation
  public async add(plugin: IStoragePlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      this.logger?.warn(`Plugin ${plugin.name} already registered`)
      return
    }

    try {
      await plugin.initialize?.()
      this.plugins.set(plugin.name, plugin)
      this.logger?.info('Plugin added', { name: plugin.name })
    } catch (error) {
      this.logger?.error(`Failed to register plugin ${plugin.name}`, error)
      throw error
    }
  }

  public async remove(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (plugin) {
      await plugin.destroy?.()
      this.plugins.delete(name)
      this.logger?.info('Plugin removed', { name })
    }
  }

  public get(name: string): IStoragePlugin | undefined {
    return this.plugins.get(name)
  }

  public getAll(): IStoragePlugin[] {
    return Array.from(this.plugins.values())
  }

  public async initialize(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.initialize?.()
    }
  }

  public async destroy(): Promise<void> {
    await Promise.all(
      Array.from(this.plugins.values())
        .map((plugin) => plugin.destroy?.() ?? Promise.resolve()),
    )
    this.plugins.clear()
  }

  // IPluginExecutor implementation
  public executeBeforeSet<T>(key: string, value: T): T {
    let result = this.parentExecutor?.executeBeforeSet(key, value) ?? value

    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeSet) {
        result = plugin.onBeforeSet(key, result)
      }
    }

    return result
  }

  public executeAfterSet<T>(key: string, value: T): void {
    this.parentExecutor?.executeAfterSet(key, value)

    for (const plugin of this.plugins.values()) {
      plugin.onAfterSet?.(key, value)
    }
  }

  public executeBeforeGet(key: string): string {
    let result = this.parentExecutor?.executeBeforeGet(key) ?? key

    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeGet) {
        result = plugin.onBeforeGet(result)
      }
    }

    return result
  }

  public executeAfterGet<T>(key: string, value: T | undefined): T | undefined {
    let result = this.parentExecutor?.executeAfterGet(key, value) ?? value

    for (const plugin of this.plugins.values()) {
      if (plugin.onAfterGet) {
        result = plugin.onAfterGet(key, result)
      }
    }

    return result
  }

  public executeBeforeDelete(key: string): boolean {
    let canDelete = this.parentExecutor?.executeBeforeDelete(key) ?? true

    for (const plugin of this.plugins.values()) {
      if (plugin.onBeforeDelete) {
        canDelete = plugin.onBeforeDelete(key) && canDelete
      }
    }

    return canDelete
  }

  public executeAfterDelete(key: string): void {
    this.parentExecutor?.executeAfterDelete(key)

    for (const plugin of this.plugins.values()) {
      plugin.onAfterDelete?.(key)
    }
  }

  public executeOnClear(): void {
    this.parentExecutor?.executeOnClear()

    for (const plugin of this.plugins.values()) {
      plugin.onClear?.()
    }
  }
}
