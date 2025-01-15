import { IPlugin, IPluginManager } from './core.interface'
import { Injectable } from '../../decorators'
import type { ILogger } from '../logger/logger.interface'

@Injectable()
export class CorePluginManager implements IPluginManager<IPlugin> {
  private plugins: Map<string, IPlugin> = new Map()

  constructor(
    private readonly logger: ILogger,
  ) {}

  add(plugin: IPlugin): void {
    if (this.plugins.has(plugin.name)) {
      this.logger.warn(`Plugin ${plugin.name} already registered, skipping`)
      return
    }
    this.plugins.set(plugin.name, plugin)
  }

  remove(name: string): void {
    this.plugins.delete(name)
  }

  get(name: string): IPlugin | undefined {
    return this.plugins.get(name)
  }

  getAll(): IPlugin[] {
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
}
